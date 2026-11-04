import { PrismaClient } from '@prisma/client';
import { hash } from '@node-rs/argon2';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Starting PostgreSQL seed for nextops_db...');
  const companyId = '00000000-0000-4000-8000-000000000001';

  await prisma.$transaction([
    prisma.apiHistory.deleteMany(),
    prisma.userAiBudget.deleteMany(),
    prisma.project.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  await prisma.company.upsert({
    where: { id: companyId },
    create: { id: companyId, name: 'NextOps Demo Workspace' },
    update: { name: 'NextOps Demo Workspace' },
  });

  // Генеруємо Argon2id хеш для пароля
  const passwordHash = await hash('nextops123456789');

  const admin = await prisma.user.create({
    data: {
      name: 'Володимир Admin',
      email: 'admin2026@nextops.com',
      passwordHash,
      role: 'OWNER',
      companyId,
    },
  });

  const project = await prisma.project.create({
    data: {
      userId: admin.id,
      companyId,
      name: 'nextops',
      description: 'Unified SaaS Hub & AI Orchestrator Core Engine',
    },
  });

  await prisma.userAiBudget.create({
    data: {
      userId: admin.id,
      companyId,
      projectId: project.id,
      monthlyLimitMinor: 50000,
      currentUsageMinor: 12450,
      resetDate: new Date('2026-11-01'),
    },
  });

  const history = Array.from({ length: 20 }, (_, index) => {
    // Повністю прибрали зовнішній масив, тепер статуси обираються через логіку switch-case
    const endpoints = ['/api/auth/login', '/api/product', '/api/order', '/api/webhookconfig'];
    const methods = ['POST', 'GET', 'POST', 'PATCH'];
    const endpointIndex = Math.floor(Math.random() * endpoints.length);
    
    let statusCode = 200;
    if (endpointIndex === 2) {
      statusCode = 201;
    }

    return {
      endpoint: endpoints[endpointIndex],
      method: methods[endpointIndex],
      statusCode: statusCode,
      durationMs: Math.floor(Math.random() * 150) + 10,
      createdAt: new Date(Date.now() - index * 3_600_000),
      companyId,
    };
  });

  await prisma.apiHistory.createMany({ data: history });
  console.log('PostgreSQL seed completed successfully.');
}

main()
  .catch((error: unknown) => {
    console.error('Database seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
