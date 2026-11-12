import 'dotenv/config';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TenantContext } from './tenant-context';

describe('Tenant Isolation, Fail-Closed Proxy & PostgreSQL RLS (Integration)', () => {
  let tenantContext: TenantContext;
  let prisma: PrismaService;

  const companyAId = '11111111-1111-4111-8111-111111111111';
  const companyBId = '22222222-2222-4222-8222-222222222222';
  let userAId = '';
  let userBId = '';
  let productAId = '';
  let orderAId = '';

  before(async () => {
    tenantContext = new TenantContext();
    prisma = new PrismaService(tenantContext);
    await prisma.$connect();

    await prisma.runSystemQuery(async () => {
      await prisma.orderItem.deleteMany({
        where: { companyId: { in: [companyAId, companyBId] } },
      });
      await prisma.order.deleteMany({
        where: { companyId: { in: [companyAId, companyBId] } },
      });
      await prisma.product.deleteMany({
        where: { companyId: { in: [companyAId, companyBId] } },
      });
      await prisma.user.deleteMany({
        where: { companyId: { in: [companyAId, companyBId] } },
      });
      await prisma.company.deleteMany({
        where: { id: { in: [companyAId, companyBId] } },
      });

      await prisma.company.createMany({
        data: [
          { id: companyAId, name: 'Test Company A' },
          { id: companyBId, name: 'Test Company B' },
        ],
      });

      const userA = await prisma.user.create({
        data: {
          companyId: companyAId,
          email: 'isolation-a@nextops.test',
          role: 'OWNER',
        },
      });
      userAId = userA.id;

      const userB = await prisma.user.create({
        data: {
          companyId: companyBId,
          email: 'isolation-b@nextops.test',
          role: 'OWNER',
        },
      });
      userBId = userB.id;

      const productA = await prisma.product.create({
        data: {
          companyId: companyAId,
          name: 'Secret Product A',
          slug: 'secret-product-a',
          priceMinor: 1500,
        },
      });
      productAId = productA.id;

      const orderA = await prisma.order.create({
        data: {
          companyId: companyAId,
          userId: userAId,
          totalAmountMinor: 1500,
          currency: 'UAH',
          shippingAddress: { city: 'Kyiv' },
        },
      });
      orderAId = orderA.id;
    });
  });

  after(async () => {
    await prisma.runSystemQuery(async () => {
      await prisma.orderItem.deleteMany({
        where: { companyId: { in: [companyAId, companyBId] } },
      });
      await prisma.order.deleteMany({
        where: { companyId: { in: [companyAId, companyBId] } },
      });
      await prisma.product.deleteMany({
        where: { companyId: { in: [companyAId, companyBId] } },
      });
      await prisma.user.deleteMany({
        where: { companyId: { in: [companyAId, companyBId] } },
      });
      await prisma.company.deleteMany({
        where: { id: { in: [companyAId, companyBId] } },
      });
    });
    await prisma.$disconnect();
  });

  function runAsCompany<T>(companyId: string, fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      tenantContext.use({} as never, {} as never, () => {
        tenantContext.setCompanyId(companyId);
        fn().then(resolve).catch(reject);
      });
    });
  }

  it('fails closed when querying tenant models without an active companyId', async () => {
    await assert.rejects(() => prisma.order.findMany(), ForbiddenException);
    await assert.rejects(() => prisma.product.findMany(), ForbiddenException);
    await assert.rejects(() => prisma.user.findMany(), ForbiddenException);
  });

  it('isolates list queries between Company A and Company B', async () => {
    const ordersA = await runAsCompany(companyAId, () => prisma.order.findMany());
    assert.equal(ordersA.length, 1);
    assert.equal(ordersA[0]?.id, orderAId);

    const ordersB = await runAsCompany(companyBId, () => prisma.order.findMany());
    assert.equal(ordersB.length, 0);

    const productsB = await runAsCompany(companyBId, () => prisma.product.findMany());
    assert.equal(productsB.length, 0);
  });

  it('prevents Company B from reading or modifying Company A order by ID (IDOR)', async () => {
    const leakedOrder = await runAsCompany(companyBId, () =>
      prisma.order.findFirst({ where: { id: orderAId } }),
    );
    assert.equal(leakedOrder, null);

    await assert.rejects(() =>
      runAsCompany(companyBId, () =>
        prisma.order.update({
          where: { id: orderAId },
          data: { status: 'SHIPPED' },
        }),
      ),
    );
  });

  it('blocks Company B from referencing Company A user or product IDs', async () => {
    await assert.rejects(
      () =>
        runAsCompany(companyBId, () =>
          prisma.order.create({
            data: {
              companyId: companyBId,
              userId: userAId,
              totalAmountMinor: 1500,
              currency: 'UAH',
              shippingAddress: {},
            },
          }),
        ),
      BadRequestException,
    );

    await assert.rejects(
      () =>
        runAsCompany(companyBId, () =>
          prisma.orderItem.create({
            data: {
              companyId: companyBId,
              orderId: orderAId,
              productId: productAId,
              quantity: 1,
              priceMinor: 1500,
            },
          }),
        ),
      BadRequestException,
    );
  });

  it('enforces PostgreSQL Row-Level Security (RLS) on raw SQL under nextops_app role', async () => {
    const rawOrders = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM "Order" WHERE id = $1`,
      orderAId,
    );
    assert.equal(rawOrders.length, 0);

    const rawProducts = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM "Product" WHERE id = $1`,
      productAId,
    );
    assert.equal(rawProducts.length, 0);
  });
});
