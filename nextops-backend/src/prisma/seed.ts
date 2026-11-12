import { PrismaClient } from '@prisma/client';
import { hash } from '@node-rs/argon2';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Starting PostgreSQL seed for nextops_db...');
  const companyId = '00000000-0000-4000-8000-000000000001';

  await prisma.plan.upsert({
    where: { code: 'FREE' },
    create: { code: 'FREE', name: 'Starter Free', priceMinor: 0, currency: 'USD', maxUsers: 3, maxProducts: 50 },
    update: {},
  });
  await prisma.plan.upsert({
    where: { code: 'PRO' },
    create: { code: 'PRO', name: 'Pro Growth', priceMinor: 2900, currency: 'USD', maxUsers: 25, maxProducts: 5000 },
    update: {},
  });
  await prisma.plan.upsert({
    where: { code: 'ENTERPRISE' },
    create: { code: 'ENTERPRISE', name: 'Enterprise Unlimited', priceMinor: 9900, currency: 'USD', maxUsers: 10000, maxProducts: 1000000 },
    update: {},
  });

  await prisma.$transaction([
    prisma.apiHistory.deleteMany({ where: { companyId } }),
    prisma.userAiBudget.deleteMany({ where: { companyId } }),
    prisma.project.deleteMany({ where: { companyId } }),
    prisma.user.deleteMany({ where: { companyId } }),
  ]);

  await prisma.company.upsert({
    where: { id: companyId },
    create: {
      id: companyId,
      name: 'NextOps Demo Workspace',
      planCode: 'PRO',
      subscriptionStatus: 'ACTIVE',
    },
    update: {
      name: 'NextOps Demo Workspace',
      planCode: 'PRO',
      subscriptionStatus: 'ACTIVE',
    },
  });

  const passwordHash = await hash('nextops123456789');

  const admin = await prisma.user.upsert({
    where: { email: 'admin2026@nextops.com' },
    create: {
      name: 'Володимир Admin',
      email: 'admin2026@nextops.com',
      passwordHash,
      role: 'OWNER',
      companyId,
    },
    update: {
      name: 'Володимир Admin',
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

  const endpoints = ['/api/auth/login', '/api/product', '/api/order', '/api/webhookconfig'];
  const methods = ['POST', 'GET', 'POST', 'PATCH'];

  const history = Array.from({ length: 20 }, (_, index) => {
    const endpointIndex = index % endpoints.length;
    const statusCode = endpointIndex === 2 ? 201 : 200;

    return {
      endpoint: endpoints[endpointIndex],
      method: methods[endpointIndex],
      statusCode,
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
