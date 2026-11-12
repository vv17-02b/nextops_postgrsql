require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

async function main() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !password || password.length < 12 || password.length > 128) {
    throw new Error('Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD (12-128 characters) before running npm run admin:create.');
  }

  const prisma = new PrismaClient();
  try {
    const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } });
    if (existingAdmin) throw new Error('An ADMIN account already exists; refusing to create another bootstrap admin.');

    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existingUser) throw new Error('That email already belongs to an account; refusing to change an existing user.');
    const passwordHash = await argon2.hash(password);
    await prisma.user.create({
      data: { email, passwordHash, role: 'ADMIN' }
    });
    console.log(`Bootstrap administrator ${email} is ready. Remove the bootstrap credentials from the environment now.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Admin bootstrap failed:', error);
  process.exitCode = 1;
});
