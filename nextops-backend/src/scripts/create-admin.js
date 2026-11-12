require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

async function main() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !password ||
    password.length < 12 ||
    password.length > 128
  ) {
    throw new Error(
      'Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD (12-128 characters) before running admin:create.',
    );
  }

  const prisma = new PrismaClient();
  try {
    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existingUser) {
      throw new Error('That email already belongs to an account; refusing to overwrite an existing user.');
    }

    await prisma.plan.upsert({
      where: { code: 'FREE' },
      create: { code: 'FREE', name: 'Starter Free', priceMinor: 0, currency: 'USD', maxUsers: 3, maxProducts: 50 },
      update: {},
    });

    const passwordHash = await argon2.hash(password);
    const created = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: `${email.split('@')} Workspace`,
          planCode: 'FREE',
          subscriptionStatus: 'TRIALING',
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: 'OWNER',
          companyId: company.id,
        },
      });

      return { user, company };
    });

    console.log(
      `Bootstrap OWNER ${created.user.email} is ready in workspace "${created.company.name}" (${created.company.id}).`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Admin bootstrap failed:', error);
  process.exitCode = 1;
});
