import { PrismaClient } from '@prisma/client';
import { hash } from '@node-rs/argon2';
import { createHash, randomBytes } from 'node:crypto';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Starting enterprise PostgreSQL seed for nextops_db...');

  const companyId = '00000000-0000-4000-8000-000000000001';
  const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim() || 'admin@nextops.local';
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD?.trim() || 'nextops123456789';
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN?.trim() || null;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID?.trim() || null;

  // 1. Тарифні плани SaaS-платформи
  await prisma.plan.upsert({
    where: { code: 'FREE' },
    create: { code: 'FREE', name: 'Starter Free', priceMinor: 0, currency: 'USD', maxUsers: 3, maxProducts: 50 },
    update: { name: 'Starter Free', priceMinor: 0, maxUsers: 3, maxProducts: 50 },
  });
  await prisma.plan.upsert({
    where: { code: 'PRO' },
    create: { code: 'PRO', name: 'Pro Growth', priceMinor: 2900, currency: 'USD', maxUsers: 25, maxProducts: 5000 },
    update: { name: 'Pro Growth', priceMinor: 2900, maxUsers: 25, maxProducts: 5000 },
  });
  await prisma.plan.upsert({
    where: { code: 'ENTERPRISE' },
    create: { code: 'ENTERPRISE', name: 'Enterprise Unlimited', priceMinor: 9900, currency: 'USD', maxUsers: 10000, maxProducts: 1000000 },
    update: { name: 'Enterprise Unlimited', priceMinor: 9900, maxUsers: 10000, maxProducts: 1000000 },
  });

  // 2. Очищення попередніх демо-записів компанії у безпечному порядку
  await prisma.$transaction([
    prisma.review.deleteMany({ where: { companyId } }),
    prisma.orderItem.deleteMany({ where: { companyId } }),
    prisma.order.deleteMany({ where: { companyId } }),
    prisma.warehouse.deleteMany({ where: { companyId } }),
    prisma.product.deleteMany({ where: { companyId } }),
    prisma.category.deleteMany({ where: { companyId } }),
    prisma.agentKnowledgeBase.deleteMany({ where: { companyId } }),
    prisma.webhookConfig.deleteMany({ where: { companyId } }),
    prisma.companyApiKey.deleteMany({ where: { companyId } }),
    prisma.auditLog.deleteMany({ where: { companyId } }),
    prisma.apiHistory.deleteMany({ where: { companyId } }),
    prisma.userAiBudget.deleteMany({ where: { companyId } }),
    prisma.project.deleteMany({ where: { companyId } }),
    prisma.user.deleteMany({ where: { companyId } }),
  ]);

  // 3. Робочий простір компанії (із підключенням Telegram із .env)
  await prisma.company.upsert({
    where: { id: companyId },
    create: {
      id: companyId,
      name: 'NextOps Enterprise Studio',
      planCode: 'PRO',
      subscriptionStatus: 'ACTIVE',
      telegramBotToken,
      telegramChatId,
    },
    update: {
      name: 'NextOps Enterprise Studio',
      planCode: 'PRO',
      subscriptionStatus: 'ACTIVE',
      telegramBotToken,
      telegramChatId,
    },
  });

  // 4. Команда компанії: Власник (із .env), Менеджер та Клієнт
  const passwordHash = await hash(adminPassword);

  const owner = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      name: 'Володимир (Founder & Owner)',
      email: adminEmail,
      passwordHash,
      role: 'OWNER',
      companyId,
    },
    update: {
      name: 'Володимир (Founder & Owner)',
      passwordHash,
      role: 'OWNER',
      companyId,
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: 'Олена Коваленко (Операційний директор)',
      email: 'manager@nextops.local',
      passwordHash,
      role: 'ADMIN',
      companyId,
    },
  });

  const customer = await prisma.user.create({
    data: {
      name: 'Андрій Мельник (Корпоративний клієнт)',
      email: 'client@nextops.local',
      passwordHash,
      role: 'MEMBER',
      companyId,
    },
  });
  // 5. Основний проєкт робочого простору
  const project = await prisma.project.create({
    data: {
      id: '00000000-0000-4000-8000-000000000002',
      userId: owner.id,
      companyId,
      name: 'NextOps Core Commerce & AI',
      description: 'Єдиний B2B SaaS-хаб: Storefront API, PostgreSQL RLS, RAG AI-консультант та Telegram-операції',
    },
  });

  // 6. Категорії каталогу
  const catPlatform = await prisma.category.create({
    data: {
      id: '00000000-0000-4000-8000-000000000003',
      companyId,
      name: 'Хмарні рішення та ліцензії',
      slug: 'cloud-solutions',
      description: 'Готові модулі підключення магазинів, API-шлюзи та AI-консультанти',
    },
  });

  const catHardware = await prisma.category.create({
    data: {
      companyId,
      name: 'POS та складське обладнання',
      slug: 'pos-equipment',
      description: 'Термінали, сканери штрих-кодів та сертифіковане обладнання з гарантією 24 міс.',
    },
  });

  // 7. Товари з реальними описами, цінами та характеристиками
  const prodGateway = await prisma.product.create({
    data: {
      id: '00000000-0000-4000-8000-000000000004',
      companyId,
      categoryId: catPlatform.id,
      name: 'NextOps Enterprise API Gateway',
      slug: 'nextops-enterprise-api-gateway',
      description: 'Підключення зовнішньої вітрини по X-Api-Key (SHA-256), Redis rate-limiting, PostgreSQL FORCE RLS та 24/7 SLA підтримка.',
      priceMinor: 9900,
      compareAtPriceMinor: 14900,
      images: [],
      isActive: true,
    },
  });

  const prodAiPack = await prisma.product.create({
    data: {
      companyId,
      categoryId: catPlatform.id,
      name: 'RAG AI-консультант по базі знань',
      slug: 'rag-ai-knowledge-assistant',
      description: 'Інтелектуальний пошук по прайсах, документах і характеристиках товарів із контролем бюджету UserAiBudget.',
      priceMinor: 4900,
      compareAtPriceMinor: 6900,
      images: [],
      isActive: true,
    },
  });

  const prodPosTerminal = await prisma.product.create({
    data: {
      companyId,
      categoryId: catHardware.id,
      name: 'Термінал обліку NextOps POS Pro',
      slug: 'nextops-pos-pro-terminal',
      description: 'Сенсорний POS-термінал зі сканером штрих-кодів, Wi-Fi/LTE, офіційна гарантія 24 місяці та обмін за 14 днів.',
      priceMinor: 24900,
      compareAtPriceMinor: 28900,
      images: [],
      isActive: true,
    },
  });

  // 8. Складські залишки
  await prisma.warehouse.createMany({
    data: [
      { companyId, productId: prodGateway.id, location: 'Cloud EU-Central (Frankfurt)', quantity: 500 },
      { companyId, productId: prodAiPack.id, location: 'Cloud EU-Central (Frankfurt)', quantity: 500 },
      { companyId, productId: prodPosTerminal.id, location: 'Головний склад Київ (Hub #1)', quantity: 18 },
    ],
  });

  // 9. Живі замовлення за останні дні (для дашборду виручки та конверсії)
  const dayMs = 86_400_000;
  await prisma.order.create({
    data: {
      companyId,
      userId: customer.id,
      status: 'PAID',
      paymentStatus: 'PAID',
      paymentMethod: 'CARD',
      totalAmountMinor: 14800,
      currency: 'USD',
      shippingAddress: { country: 'UA', city: 'Київ', street: 'вул. Хрещатик, 1', zipCode: '01001' },
      createdAt: new Date(Date.now() - 2 * dayMs),
      items: {
        create: [
          { productId: prodGateway.id, quantity: 1, priceMinor: 9900 },
          { productId: prodAiPack.id, quantity: 1, priceMinor: 4900 },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      companyId,
      userId: customer.id,
      status: 'SHIPPED',
      paymentStatus: 'PAID',
      paymentMethod: 'CARD',
      totalAmountMinor: 24900,
      currency: 'USD',
      shippingAddress: { country: 'UA', city: 'Львів', street: 'просп. Свободи, 15', zipCode: '79000' },
      createdAt: new Date(Date.now() - dayMs),
      items: {
        create: [
          { productId: prodPosTerminal.id, quantity: 1, priceMinor: 24900 },
        ],
      },
    },
  });
  // 10. Рейтинги та відгуки клієнтів (оцінки 5/5)
  await prisma.review.createMany({
    data: [
      {
        companyId,
        userId: customer.id,
        productId: prodGateway.id,
        rating: 5,
        comment: 'Підключили наш інтернет-магазин за 15 хвилин по X-Api-Key. Замовлення летять у Telegram миттєво!',
      },
      {
        companyId,
        userId: manager.id,
        productId: prodPosTerminal.id,
        rating: 5,
        comment: 'Швидкий термінал, офіційна гарантія 24 місяці та миттєва синхронізація залишків зі складом.',
      },
    ],
  });

  // 11. Корпоративна база знань для RAG AI-консультанта (гарантії, повернення, характеристики, SLA)
  await prisma.agentKnowledgeBase.createMany({
    data: [
      {
        companyId,
        projectId: project.id,
        title: 'Офіційні умови гарантії та обміну товарів',
        content:
          'На все обладнання NextOps POS діє офіційна гарантія 24 місяці з дати покупки. Обмін або повернення товару належної якості можливі протягом 14 календарних днів за наявності чека. На хмарні ліцензії діє гарантія доступності SLA 99.9%.',
        metadata: { category: 'warranty', tags: ['гарантія', 'повернення', 'обмін', 'SLA'] },
      },
      {
        companyId,
        projectId: project.id,
        title: 'Технічні характеристики та безпека платформи NextOps',
        content:
          'Платформа побудована на PostgreSQL 17 із примусовою ізоляцією даних FORCE ROW LEVEL SECURITY (RLS), кешем Redis 7, автентифікацією Argon2id + HttpOnly Cookie та захистом вебхуків криптографічним підписом HMAC-SHA256.',
        metadata: { category: 'specs', tags: ['характеристики', 'безпека', 'PostgreSQL', 'RLS'] },
      },
      {
        companyId,
        projectId: project.id,
        title: 'Умови підключення магазинів, доставка та техпідтримка',
        content:
          'Доставка обладнання по Україні (Нова Пошта / курʼєр) займає 1–2 робочі дні. Підключення інтернет-магазину через Storefront API (/api/public/v1/*) по ключу X-Api-Key займає 15 хвилин. Техпідтримка працює 24/7 у Telegram.',
        metadata: { category: 'delivery-support', tags: ['доставка', 'умови', 'API', 'підтримка'] },
      },
    ],
  });

  // 12. FinOps AI-бюджет для власника та менеджера
  await prisma.userAiBudget.createMany({
    data: [
      {
        userId: owner.id,
        companyId,
        projectId: project.id,
        monthlyLimitMinor: 50000,
        currentUsageMinor: 2500,
        resetDate: new Date('2027-01-01'),
      },
      {
        userId: manager.id,
        companyId,
        projectId: project.id,
        monthlyLimitMinor: 20000,
        currentUsageMinor: 500,
        resetDate: new Date('2027-01-01'),
      },
    ],
  });

  // 13. Демо API-ключ для підключення зовнішньої вітрини та вихідний вебхук
  const demoApiKey = 'nx_live_demo_storefront_key_nextops_2026';
  const keyHash = createHash('sha256').update(demoApiKey).digest('hex');

  await prisma.companyApiKey.create({
    data: {
      companyId,
      name: 'Основна вітрина інтернет-магазину',
      keyHash,
      prefix: demoApiKey.slice(0, 12),
      scopes: ['read:products', 'write:orders', 'write:reviews'],
      isActive: true,
    },
  });

  await prisma.webhookConfig.create({
    data: {
      companyId,
      projectId: project.id,
      url: 'https://example.com',
      secret: `whsec_${randomBytes(16).toString('hex')}`,
      events: ['ORDER_CREATED', 'ORDER_PAID', 'ORDER_STATUS_UPDATED'],
      isActive: true,
    },
  });

  // 14. Початковий запис у журналі аудиту
  await prisma.auditLog.create({
    data: {
      companyId,
      actorUserId: owner.id,
      actorEmail: adminEmail,
      action: 'WORKSPACE_SEEDED',
      entityType: 'Company',
      entityId: companyId,
      metadata: { planCode: 'PRO', demoApiKeyPrefix: demoApiKey.slice(0, 12) },
    },
  });

  console.log(`Enterprise seed completed. Admin login: ${adminEmail}`);
}

main()
  .catch((error: unknown) => {
    console.error('Database seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
