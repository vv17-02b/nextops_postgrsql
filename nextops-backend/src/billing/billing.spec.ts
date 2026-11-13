import { TelegramNotifierService } from '../common/queue/telegram-notifier.service';
import 'dotenv/config';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { HttpException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { PlanEnforcementService } from './plan-enforcement.service';
import { BillingService, type BillingWebhookPayload } from './billing.service';

describe('SaaS Billing, Plan Enforcement & Signed Webhooks (Integration)', () => {
  let tenantContext: TenantContext;
  let prisma: PrismaService;
  let planEnforcement: PlanEnforcementService;
  let billingService: BillingService;

  const testCompanyId = '33333333-3333-4333-8333-333333333333';
  const testEventId = 'evt_test_upgrade_pro_001';
  const webhookSecret = 'test-billing-webhook-secret-32-chars!!';

  before(async () => {
    process.env.BILLING_WEBHOOK_SECRET = webhookSecret;
    tenantContext = new TenantContext();
    prisma = new PrismaService(tenantContext);
    await prisma.$connect();
    planEnforcement = new PlanEnforcementService(prisma, tenantContext);
    billingService = new BillingService(prisma, tenantContext, planEnforcement, new TelegramNotifierService(prisma));

    await prisma.runSystemQuery(async () => {
      await prisma.processedWebhookEvent.deleteMany({ where: { id: testEventId } });
      await prisma.user.deleteMany({ where: { companyId: testCompanyId } });
      await prisma.company.deleteMany({ where: { id: testCompanyId } });

      await prisma.company.create({
        data: {
          id: testCompanyId,
          name: 'Billing Test Workspace',
          planCode: 'FREE',
          subscriptionStatus: 'TRIALING',
        },
      });

      await prisma.user.createMany({
        data: [
          { companyId: testCompanyId, email: 'seat1@nextops.test', role: 'OWNER' },
          { companyId: testCompanyId, email: 'seat2@nextops.test', role: 'MEMBER' },
          { companyId: testCompanyId, email: 'seat3@nextops.test', role: 'MEMBER' },
        ],
      });
    });
  });

  after(async () => {
    await prisma.runSystemQuery(async () => {
      await prisma.processedWebhookEvent.deleteMany({ where: { id: testEventId } });
      await prisma.user.deleteMany({ where: { companyId: testCompanyId } });
      await prisma.company.deleteMany({ where: { id: testCompanyId } });
    });
    await prisma.$disconnect();
  });

  function runAsTestCompany<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      tenantContext.use({} as never, {} as never, () => {
        tenantContext.setCompanyId(testCompanyId);
        fn().then(resolve).catch(reject);
      });
    });
  }

  it('blocks adding a 4th user on FREE plan (3/3 seats used) with 402 Payment Required', async () => {
    await assert.rejects(
      () => runAsTestCompany(() => planEnforcement.assertUserSeatLimit(testCompanyId)),
      (err: unknown) => err instanceof HttpException && err.getStatus() === 402,
    );
  });

  it('rejects unsigned or forged billing webhooks', async () => {
    const payload: BillingWebhookPayload = {
      id: testEventId,
      type: 'subscription.activated',
      data: { companyId: testCompanyId, planCode: 'PRO' },
    };
    const rawBody = JSON.stringify(payload);

    await assert.rejects(
      () => billingService.processSignedWebhook(rawBody, 'sha256=forged_signature', payload),
      UnauthorizedException,
    );
  });

  it('upgrades plan via valid HMAC-SHA256 webhook, deduplicates replay, and unlocks seats', async () => {
    const payload: BillingWebhookPayload = {
      id: testEventId,
      type: 'subscription.activated',
      data: {
        companyId: testCompanyId,
        planCode: 'PRO',
        billingCustomerId: 'cus_test_001',
        billingSubscriptionId: 'sub_test_001',
      },
    };
    const rawBody = JSON.stringify(payload);
    const validSignature =
      'sha256=' + createHmac('sha256', webhookSecret).update(rawBody, 'utf8').digest('hex');

    const firstResult = await billingService.processSignedWebhook(rawBody, validSignature, payload);
    assert.deepEqual(firstResult, { received: true });

    const replayResult = await billingService.processSignedWebhook(rawBody, validSignature, payload);
    assert.deepEqual(replayResult, { received: true, deduplicated: true });

    await runAsTestCompany(() => planEnforcement.assertUserSeatLimit(testCompanyId));
  });
});
