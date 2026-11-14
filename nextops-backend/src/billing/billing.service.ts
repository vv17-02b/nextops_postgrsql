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
import { readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
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
  platformBotUsername: string | null;
  deepLinkUrl: string | null;
  envQuickConnectAvailable: boolean;
}

export interface NotificationSoundOption {
  id: string;
  label: string;
  type: 'file' | 'synth' | 'mute';
  url?: string;
}

export interface TelegramNotificationEvent {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  sender: string;
  summary: string;
  text: string | null;
  newStatus: string | null;
  createdAt: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
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
  ) { }

  async listPlans(): Promise<Plan[]> {
    return this.prisma.runSystemQuery(() =>
      this.prisma.plan.findMany({
        where: { isActive: true },
        orderBy: { priceMinor: 'asc' },
      }),
    );
  }

  async listNotificationSounds(): Promise<{ sounds: NotificationSoundOption[] }> {
    const sounds: NotificationSoundOption[] = [];
    const voiceDir = join(process.cwd(), 'uploads', 'voice');
    const allowedExt = new Set(['.mp3', '.wav', '.ogg', '.m4a']);

    try {
      const entries = await readdir(voiceDir);
      const audioFiles = entries
        .filter((file) => allowedExt.has(extname(file).toLowerCase()))
        .sort((a, b) => a.localeCompare(b));

      for (const fileName of audioFiles) {
        const cleanTitle = fileName
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        sounds.push({
          id: `file:${fileName}`,
          label: cleanTitle ? `🎵 ${cleanTitle}` : `🎵 ${fileName}`,
          type: 'file',
          url: `/uploads/voice/${encodeURIComponent(fileName)}`,
        });
      }
    } catch {
      // Directory may be empty or missing in fresh environments; built-in presets follow below.
    }

    sounds.push(
      { id: 'synth:glass', label: '🔔 Crisp Glass Ping (Вбудований)', type: 'synth' },
      { id: 'synth:chime', label: '✨ Soft SaaS Chime (Вбудований)', type: 'synth' },
      { id: 'mute', label: '🔇 Без звуку (Mute)', type: 'mute' },
    );

    return { sounds };
  }

  async getRecentTelegramNotifications(
    companyId?: string,
  ): Promise<{ events: TelegramNotificationEvent[] }> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (!activeCompanyId) {
      return { events: [] };
    }

    const rows = await this.prisma.runSystemQuery(() =>
      this.prisma.auditLog.findMany({
        where: {
          companyId: activeCompanyId,
          action: { in: ['TELEGRAM_INCOMING_MESSAGE', 'TELEGRAM_ORDER_ACTION'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 25,
      }),
    );
    const events: TelegramNotificationEvent[] = rows.map((row) => {
      const meta = isRecord(row.metadata) ? row.metadata : {};
      const sender =
        typeof meta.sender === 'string'
          ? meta.sender
          : row.actorEmail ?? 'Telegram';
      const summary =
        typeof meta.summary === 'string'
          ? meta.summary
          : row.action === 'TELEGRAM_ORDER_ACTION'
            ? `Оновлено статус замовлення через Telegram`
            : `Нове повідомлення з Telegram`;
      const text = typeof meta.text === 'string' ? meta.text : null;
      const newStatus = typeof meta.newStatus === 'string' ? meta.newStatus : null;

      return {
        id: row.id,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        sender,
        summary,
        text,
        newStatus,
        createdAt: row.createdAt.toISOString(),
      };
    });

    return { events };
  }

  async clearTelegramMessages(companyId?: string): Promise<{ deletedCount: number }> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (!activeCompanyId) {
      throw new ForbiddenException('A business workspace is required.');
    }

    const result = await this.prisma.runSystemQuery(() =>
      this.prisma.auditLog.deleteMany({
        where: {
          companyId: activeCompanyId,
          action: 'TELEGRAM_INCOMING_MESSAGE',
        },
      }),
    );

    return { deletedCount: result.count };
  }

  async getStatus(companyId?: string): Promise<{
    billing: WorkspaceBillingSnapshot;
    plans: Plan[];
    providerConfigured: boolean;
    telegram: TelegramConfigSnapshot;
  }> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    const [billing, plans, companyTg, botUsername] = await Promise.all([
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
      this.telegramNotifier.getPlatformBotUsername(),
    ]);

    const rawToken = companyTg?.telegramBotToken ?? null;
    const maskedToken =
      rawToken && rawToken.length >= 8
        ? `${rawToken.slice(0, 4)}••••${rawToken.slice(-4)}`
        : rawToken
          ? '••••••••'
          : null;

    const deepLinkUrl =
      botUsername && activeCompanyId
        ? `https://t.me{botUsername}?start=connect_${activeCompanyId}`
        : null;

    const envQuickConnectAvailable = Boolean(
      process.env.TELEGRAM_BOT_TOKEN?.trim() && process.env.TELEGRAM_CHAT_ID?.trim(),
    );

    return {
      billing,
      plans,
      providerConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
      telegram: {
        connected: Boolean(rawToken && companyTg?.telegramChatId),
        chatId: companyTg?.telegramChatId ?? null,
        maskedToken,
        platformBotUsername: botUsername,
        deepLinkUrl,
        envQuickConnectAvailable,
      },
    };
  }
  async connectPlatformTelegramFromEnv(
    companyId?: string,
  ): Promise<{ connected: boolean; chatId: string }> {
    const envToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
    const envChatId = process.env.TELEGRAM_CHAT_ID?.trim();
    if (!envToken || !envChatId) {
      throw new BadRequestException(
        'Системний TELEGRAM_BOT_TOKEN або TELEGRAM_CHAT_ID не задано у .env сервера.',
      );
    }
    return this.configureTelegram(envToken, envChatId, true, companyId);
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

    let resolvedToken = botToken.trim();
    if (!resolvedToken) {
      const existing = await this.prisma.runSystemQuery(() =>
        this.prisma.company.findUnique({
          where: { id: activeCompanyId },
          select: { telegramBotToken: true },
        }),
      );
      resolvedToken = existing?.telegramBotToken?.trim() || process.env.TELEGRAM_BOT_TOKEN?.trim() || '';
    }

    if (!resolvedToken) {
      throw new BadRequestException('Вкажіть Telegram Bot Token або задайте TELEGRAM_BOT_TOKEN у .env.');
    }

    const trimmedChatId = chatId.trim();

    if (sendTest) {
      await this.telegramNotifier.sendMessage(
        resolvedToken,
        trimmedChatId,
        '✅ <b>NextOps підключено!</b> Тепер сюди миттєво надходитимуть чеки про нові замовлення.',
      );
    }

    await this.prisma.runSystemQuery(() =>
      this.prisma.company.update({
        where: { id: activeCompanyId },
        data: {
          telegramBotToken: resolvedToken,
          telegramChatId: trimmedChatId,
        },
      }),
    );

    return { connected: true, chatId: trimmedChatId };
  }

  private async notifyPlanActivated(
    companyId: string,
    planName: string,
    priceMinor: number,
    currency: string,
    modeLabel: string,
  ): Promise<void> {
    const company = await this.prisma.runSystemQuery(() =>
      this.prisma.company.findUnique({
        where: { id: companyId },
        select: { name: true, telegramBotToken: true, telegramChatId: true },
      }),
    );

    if (!company?.telegramBotToken || !company.telegramChatId) {
      return;
    }

    const amountFormatted = (priceMinor / 100).toFixed(2);
    const text = [
      `💳 <b>Підписку оновлено у ${company.name}</b>`,
      ``,
      `🚀 <b>Тариф:</b> ${planName}`,
      `💰 <b>Сума:</b> ${amountFormatted} ${currency}`,
      `⚙️ <b>Режим оплати:</b> ${modeLabel}`,
    ].join('\n');

    await this.telegramNotifier
      .sendMessage(company.telegramBotToken, company.telegramChatId, text)
      .catch(() => undefined);
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

    const frontendBase = process.env.FRONTEND_URL ?? 'http://localhost:3000';

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
      const returnUrl = new URL('/billing?upgraded=FREE', frontendBase);
      return { checkoutUrl: returnUrl.toString() };
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();

    if (!stripeKey) {
      const nextPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await this.prisma.runSystemQuery(() =>
        this.prisma.company.update({
          where: { id: activeCompanyId },
          data: {
            planCode: plan.code,
            subscriptionStatus: 'ACTIVE',
            currentPeriodEnd: nextPeriodEnd,
          },
        }),
      );

      await this.notifyPlanActivated(
        activeCompanyId,
        plan.name,
        plan.priceMinor,
        plan.currency,
        'Sandbox Demo Checkout',
      );

      const demoReturnUrl = new URL(`/billing?checkout=success&plan=${plan.code}`, frontendBase);
      return { checkoutUrl: demoReturnUrl.toString() };
    }

    const body = new URLSearchParams({
      mode: 'subscription',
      'line_items[price_data][currency]': plan.currency.toLowerCase(),
      'line_items[price_data][unit_amount]': String(plan.priceMinor),
      'line_items[price_data][recurring][interval]': 'month',
      'line_items[price_data][product_data][name]': `NextOps ${plan.name}`,
      'line_items[quantity]': '1',
      client_reference_id: activeCompanyId,
      'metadata[companyId]': activeCompanyId,
      'metadata[planCode]': plan.code,
      success_url: `${frontendBase}/billing?checkout=success&plan=${plan.code}`,
      cancel_url: `${frontendBase}/billing?checkout=canceled`,
    });

    const stripeSessionsEndpoint = 'https://stripe.com';
    const response = await fetch(stripeSessionsEndpoint, {
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
