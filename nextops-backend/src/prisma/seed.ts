import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Запуск процесу індустріального засівання nextops_db...');

  // 1. Очищення застарілих даних (Очищуємо через сирі команди, бо Time-Series не підтримує deleteMany без фільтра)
  try {
    await prisma.$runCommandRaw({ drop: 'ApiHistory' });
    console.log('🧹 Колекцію ApiHistory успішно скинуто для перевипуску.');
  } catch (e) {
    console.log('ℹ Колекція ApiHistory порожня або ще не створена, рушаємо далі.');
  }

  await prisma.userAiBudget.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Створення Головного Адміністратора
  const admin = await prisma.user.create({
    data: {
      name: 'Володимир Admin',
      email: 'admin2026@nextops.com',
      role: 'ADMIN',
    },
  });

   // 3. Створення Системного B2B Проекту з ПРАВИЛЬНИМ ІМЕНЕМ
  const project = await prisma.project.create({
    data: {
      userId: admin.id,
      name: 'nextops', //  ФІКС: Тепер ім'я строго відповідає твоєму package.json!
      description: 'Unified SaaS Hub & AI Orchestrator Core Engine',
    },
  });


  // 4. Ініціалізація FinOps Бюджету
  await prisma.userAiBudget.create({
    data: {
      userId: admin.id,
      projectId: project.id,
      monthlyLimit: 500.00,
      currentUsage: 124.50,
      resetDate: new Date('2026-11-01'),
    },
  });

  // 5. Високошвидкісне засівання Time-Series колекції
  console.log('📊 Послідовне засівання Time-Series логів у ApiHistory без транзакцій...');
  
  const endpoints = ['/api/auth/login', '/api/product', '/api/order', '/api/webhookconfig'];
  const methods = ['POST', 'GET', 'POST', 'PATCH'];
  const statuses = Array.from({ length: 4 }, (_, i) => i === 2 ? 201 : 200);

  // ФІКС: Використовуємо послідовний цикл for...of замість Promise.all для обходу помилки 263
  for (let index = 0; index < 20; index++) {
    const randomIdx = Math.floor(Math.random() * endpoints.length);
    
    await prisma.$runCommandRaw({
      insert: 'ApiHistory',
      documents: [
        {
          endpoint: endpoints[randomIdx],
          method: methods[randomIdx],
          statusCode: statuses[randomIdx],
          durationMs: Math.floor(Math.random() * 150) + 10,
          createdAt: new Date(Date.now() - index * 3600000), // Кожну годину назад
        }
      ]
    });
  }

  console.log('✔ [SUCCESS]: Обмеження Time-Series обійдено! Базу nextops_db успішно заселено.');
}

main()
  .catch((e) => {
    console.error('❌ Помилка під час виконання засівання бази:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
