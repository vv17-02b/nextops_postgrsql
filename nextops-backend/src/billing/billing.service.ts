import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Plan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { TelegramNotifierService } from '../common/queue/telegram-notifier.service';
import { PlanEnforcementService, type WorkspaceBillingSnapshot } from './plan-enforcement.service';

export interface BillingWebhookPayload {
  id: string;
  type:
    | 'subscription.activated'
    | 'subscription.renewed'
    | 'subscription.past_due'
    | 'subscription.canceled';
  data: {
    companyId: string;
    planCode: string;
    billingCustomerId?: string;
    billingSubscriptionId?: string;
    currentPeriodEnd?: string;
  };
}

export interface TelegramConfigSnapshot {
  connected: boolean;
  chatId: string | null;
  maskedToken: string | null;
}

@Injectable()
export class BillingService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TenantContext)
    private readonly tenantContext: TenantContext,
    @Inject(PlanEnforcementService)
    private readonly planEnforcement: PlanEnforcementService,
    @Inject(TelegramNotifierService)
    private readonly telegramNotifier: TelegramNotifierService,
  ) {}

  async listPlans(): Promise<Plan[]> {
    return this.prisma.runSystemQuery(() =>
      this.prisma.plan.findMany({
        where: { isActive: true },
        orderBy: { priceMinor: 'asc' },
      }),
    );
  }

  async getStatus(companyId?: string): Promise<{
    billing: WorkspaceBillingSnapshot;
    plans: Plan[];
    providerConfigured: boolean;
    telegram: TelegramConfigSnapshot;
  }> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    const [billing, plans, companyTg] = await Promise.all([
      this.planEnforcement.getBillingSnapshot(activeCompanyId ?? undefined),
      this.listPlans(),
      activeCompanyId
        ? this.prisma.runSystemQuery(() =>
            this.prisma.company.findUnique({
              where: { id: activeCompanyId },
              select: { telegramBotToken: true, telegramChatId: true },
            }),
          )
        : Promise.resolve(null),
    ]);

    const rawToken = companyTg?.telegramBotToken ?? null;
    const maskedToken =
      rawToken && rawToken.length >= 8
        ? `${rawToken.slice(0, 4)}••••${rawToken.slice(-4)}`
        : rawToken
          ? '••••••••'
          : null;

    return {
      billing,
      plans,
      providerConfigured: Boolean(process.env.BILLING_WEBHOOK_SECRET && process.env.STRIPE_SECRET_KEY),
      telegram: {
        connected: Boolean(rawToken && companyTg?.telegramChatId),
        chatId: companyTg?.telegramChatId ?? null,
        maskedToken,
      },
    };
  }

  async configureTelegram(
    botToken: string,
    chatId: string,
    sendTest: boolean,
    companyId?: string,
  ): Promise<{ connected: boolean; chatId: string }> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (!activeCompanyId) {
      throw new ForbiddenException('A business workspace is required.');
    }

    const trimmedToken = botToken.trim();
    const trimmedChatId = chatId.trim();

    if (sendTest) {
      await this.telegramNotifier.sendMessage(
        trimmedToken,
        trimmedChatId,
        '✅ <b>NextOps підключено!</b> Тепер сюди миттєво надходитимуть чеки про нові замовлення.',
      );
    }

    await this.prisma.runSystemQuery(() =>
      this.prisma.company.update({
        where: { id: activeCompanyId },
        data: {
          telegramBotToken: trimmedToken,
          telegramChatId: trimmedChatId,
        },
      }),
    );

    return { connected: true, chatId: trimmedChatId };
  }

  async createCheckout(
    planCode: string,
    companyId?: string,
  ): Promise<{ checkoutUrl: string }> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (!activeCompanyId) {
      throw new ForbiddenException('A business workspace is required.');
    }

    const plan = await this.prisma.runSystemQuery(() =>
      this.prisma.plan.findUnique({ where: { code: planCode.toUpperCase() } }),
    );
    if (!plan || !plan.isActive) {
      throw new NotFoundException(`Tariff plan "${planCode}" was not found.`);
    }

    if (plan.priceMinor === 0) {
      await this.prisma.runSystemQuery(() =>
        this.prisma.company.update({
          where: { id: activeCompanyId },
          data: {
            planCode: plan.code,
            subscriptionStatus: 'ACTIVE',
            currentPeriodEnd: null,
          },
        }),
      );
      const returnUrl = new URL('/billing?upgraded=FREE', process.env.FRONTEND_URL ?? 'http://localhost:3000');
      return { checkoutUrl: returnUrl.toString() };
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new ServiceUnavailableException({
        errorCode: 'BILLING_PROVIDER_NOT_CONFIGURED',
        message: 'Paid subscription checkout requires STRIPE_SECRET_KEY and BILLING_WEBHOOK_SECRET in the server environment.',
      });
    }

    const frontendBase = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const body = new URLSearchParams({
      mode: 'subscription',
      'line_items[0][price_data][currency]': plan.currency.toLowerCase(),
      'line_items[0][price_data][unit_amount]': String(plan.priceMinor),
      'line_items[0][price_data][recurring][interval]': 'month',
      'line_items[0][price_data][product_data][name]': `NextOps ${plan.name}`,
      'line_items[0][quantity]': '1',
      client_reference_id: activeCompanyId,
      'metadata[companyId]': activeCompanyId,
      'metadata[planCode]': plan.code,
      success_url: `${frontendBase}/billing?checkout=success`,
      cancel_url: `${frontendBase}/billing?checkout=canceled`,
    });

    const response = await fetch('https://stripe.com', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const sessionPayload = (await response.json()) as { url?: string; error?: { message?: string } };
    if (!response.ok || !sessionPayload.url) {
      throw new BadRequestException(
        sessionPayload.error?.message ?? 'Failed to create payment checkout session.',
      );
    }

    return { checkoutUrl: sessionPayload.url };
  }
  verifyWebhookSignature(rawBody: string, signatureHeader?: string): void {
    const secret = process.env.BILLING_WEBHOOK_SECRET;
    if (!secret) {
      throw new ServiceUnavailableException({
        errorCode: 'BILLING_WEBHOOK_NOT_CONFIGURED',
        message: 'BILLING_WEBHOOK_SECRET is not configured on the server.',
      });
    }

    if (!signatureHeader) {
      throw new UnauthorizedException('Missing X-Billing-Signature header.');
    }

    const expectedHex = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
    const providedHex = signatureHeader.replace(/^sha256=/i, '').trim();

    const expectedBuf = Buffer.from(expectedHex, 'utf8');
    const providedBuf = Buffer.from(providedHex, 'utf8');

    if (expectedBuf.length !== providedBuf.length || !timingSafeEqual(expectedBuf, providedBuf)) {
      throw new UnauthorizedException('Invalid webhook cryptographic signature.');
    }
  }

  async processSignedWebhook(
    rawBody: string,
    signatureHeader: string | undefined,
    payload: BillingWebhookPayload,
  ): Promise<{ received: true; deduplicated?: boolean }> {
    this.verifyWebhookSignature(rawBody, signatureHeader);

    if (!payload?.id || !payload?.type || !payload?.data?.companyId) {
      throw new BadRequestException('Invalid billing webhook payload.');
    }

    return this.prisma.runSystemQuery(async () => {
      const alreadyProcessed = await this.prisma.processedWebhookEvent.findUnique({
        where: { id: payload.id },
      });

      if (alreadyProcessed) {
        return { received: true as const, deduplicated: true };
      }

      const company = await this.prisma.company.findUnique({
        where: { id: payload.data.companyId },
        select: { id: true },
      });
      if (!company) {
        throw new NotFoundException(`Company ${payload.data.companyId} not found.`);
      }

      const nextStatusMap: Record<BillingWebhookPayload['type'], string> = {
        'subscription.activated': 'ACTIVE',
        'subscription.renewed': 'ACTIVE',
        'subscription.past_due': 'PAST_DUE',
        'subscription.canceled': 'CANCELED',
      };

      const nextStatus = nextStatusMap[payload.type];
      if (!nextStatus) {
        throw new BadRequestException(`Unsupported webhook event type: ${payload.type}`);
      }

      const nextPlanCode = payload.data.planCode
        ? payload.data.planCode.toUpperCase()
        : undefined;

      if (nextPlanCode) {
        const planExists = await this.prisma.plan.findUnique({
          where: { code: nextPlanCode },
          select: { code: true },
        });
        if (!planExists) {
          throw new BadRequestException(`Unknown plan code: ${nextPlanCode}`);
        }
      }

      const defaultPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const parsedPeriodEnd = payload.data.currentPeriodEnd
        ? new Date(payload.data.currentPeriodEnd)
        : defaultPeriodEnd;

      await this.prisma.$transaction([
        this.prisma.processedWebhookEvent.create({
          data: {
            id: payload.id,
            provider: 'billing',
            eventType: payload.type,
          },
        }),
        this.prisma.company.update({
          where: { id: payload.data.companyId },
          data: {
            ...(nextPlanCode ? { planCode: nextPlanCode } : {}),
            subscriptionStatus: nextStatus,
            ...(payload.data.billingCustomerId
              ? { billingCustomerId: payload.data.billingCustomerId }
              : {}),
            ...(payload.data.billingSubscriptionId
              ? { billingSubscriptionId: payload.data.billingSubscriptionId }
              : {}),
            currentPeriodEnd:
              nextStatus === 'ACTIVE' ? parsedPeriodEnd : undefined,
          },
        }),
      ]);

      return { received: true as const };
    });
  }
}
