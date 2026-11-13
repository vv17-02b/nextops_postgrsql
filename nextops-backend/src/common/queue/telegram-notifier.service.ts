import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as https from 'node:https';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface OrderTelegramSummary {
  orderId: string;
  totalAmountMinor: number;
  currency: string;
  itemsCount: number;
  status: string;
}

interface TelegramInlineButton {
  text: string;
  callback_data: string;
}

interface TelegramInlineKeyboard {
  inline_keyboard: TelegramInlineButton[][];
}

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

interface TelegramChat {
  id: number;
}

interface TelegramMessage {
  message_id: number;
  chat: TelegramChat;
  from?: TelegramUser;
  text?: string;
}

interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

interface TelegramUpdatesResponse {
  ok: boolean;
  result?: TelegramUpdate[];
}

interface BoundCompanyTarget {
  id: string;
  name: string;
  telegramChatId: string;
}

function telegramHttpsRequest(
  path: string,
  method: 'GET' | 'POST',
  body?: Record<string, unknown>,
): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const serialized = body ? JSON.stringify(body) : undefined;
    const req = https.request(
      {
        hostname: 'api.telegram.org',
        port: 443,
        path,
        method,
        family: 4,
        timeout: 10_000,
        headers: serialized
          ? {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(serialized),
          }
          : undefined,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode ?? 500,
            body: Buffer.concat(chunks).toString('utf8'),
          });
        });
      },
    );

    req.on('timeout', () => {
      req.destroy(new Error('Telegram API request timed out (IPv4)'));
    });
    req.on('error', (err) => reject(err));

    if (serialized) {
      req.write(serialized);
    }
    req.end();
  });
}

@Injectable()
export class TelegramNotifierService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramNotifierService.name);
  private readonly offsetsByToken = new Map<string, number>();
  private pollTimer: NodeJS.Timeout | null = null;
  private isPolling = false;

  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) { }

  onModuleInit(): void {
    if (process.env.TELEGRAM_POLLING_ENABLED === 'false') {
      return;
    }
    void this.clearWebhooksAndPoll();
    this.pollTimer = setInterval(() => {
      void this.pollAllCompanyBots();
    }, 3_000);
  }

  onModuleDestroy(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private async clearWebhooksAndPoll(): Promise<void> {
    try {
      const companies = await this.prisma.runSystemQuery(() =>
        this.prisma.company.findMany({
          where: { telegramBotToken: { not: null } },
          select: { telegramBotToken: true },
        }),
      );
      const tokens = new Set(
        companies.map((c) => c.telegramBotToken?.trim()).filter((t): t is string => Boolean(t)),
      );
      for (const token of tokens) {
        await telegramHttpsRequest(`/bot${encodeURIComponent(token)}/deleteWebhook`, 'POST', {
          drop_pending_updates: false,
        }).catch(() => undefined);
      }
    } catch {
      // Ignore startup cleanup errors
    }
    await this.pollAllCompanyBots();
  }

  async sendMessage(
    botToken: string,
    chatId: string,
    text: string,
    replyMarkup?: TelegramInlineKeyboard,
  ): Promise<boolean> {
    const path = `/bot${encodeURIComponent(botToken)}/sendMessage`;
    const response = await telegramHttpsRequest(path, 'POST', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    });

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(`Telegram API HTTP ${response.statusCode}: ${response.body}`);
    }
    return true;
  }

  private async answerCallbackQuery(
    botToken: string,
    callbackQueryId: string,
    text: string,
  ): Promise<void> {
    const path = `/bot${encodeURIComponent(botToken)}/answerCallbackQuery`;
    await telegramHttpsRequest(path, 'POST', {
      callback_query_id: callbackQueryId,
      text,
      show_alert: false,
    }).catch(() => undefined);
  }
  async notifyNewOrder(companyId: string, order: OrderTelegramSummary): Promise<void> {
    const company = await this.prisma.runSystemQuery(() =>
      this.prisma.company.findUnique({
        where: { id: companyId },
        select: { name: true, telegramBotToken: true, telegramChatId: true },
      }),
    );

    if (!company?.telegramBotToken || !company.telegramChatId) {
      return;
    }

    const amountFormatted = (order.totalAmountMinor / 100).toFixed(2);
    const message = [
      `🛒 <b>Нове замовлення у ${company.name}</b>`,
      ``,
      `🆔 <b>ID:</b> <code>${order.orderId}</code>`,
      `💰 <b>Сума:</b> <b>${amountFormatted} ${order.currency}</b>`,
      `📦 <b>Позицій:</b> ${order.itemsCount}`,
      `📌 <b>Статус:</b> ${order.status}`,
      ``,
      `<i>Натисніть кнопку нижче або надішліть відгук у відповідь:</i>`,
    ].join('\n');

    const keyboard: TelegramInlineKeyboard = {
      inline_keyboard: [
        [
          { text: '✅ Підтвердити', callback_data: `order_confirm:${order.orderId}` },
          { text: '❌ Скасувати', callback_data: `order_cancel:${order.orderId}` },
        ],
      ],
    };

    try {
      await this.sendMessage(company.telegramBotToken, company.telegramChatId, message, keyboard);
    } catch (err: unknown) {
      this.logger.warn(
        `Failed to deliver Telegram notification for company ${companyId}: ${err instanceof Error ? err.message : 'unknown error'}`,
      );
    }
  }

  private formatSenderName(user?: TelegramUser): string {
    if (!user) return 'Telegram Користувач';
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
    if (fullName && user.username) return `${fullName} (@${user.username})`;
    if (fullName) return fullName;
    if (user.username) return `@${user.username}`;
    return `ID ${user.id}`;
  }

  private async pollAllCompanyBots(): Promise<void> {
    if (this.isPolling) return;
    this.isPolling = true;

    try {
      const companies = await this.prisma.runSystemQuery(() =>
        this.prisma.company.findMany({
          where: {
            telegramBotToken: { not: null },
            telegramChatId: { not: null },
          },
          select: {
            id: true,
            name: true,
            telegramBotToken: true,
            telegramChatId: true,
          },
        }),
      );

      const companiesByToken = new Map<string, BoundCompanyTarget[]>();

      for (const company of companies) {
        const token = company.telegramBotToken?.trim();
        const chatId = company.telegramChatId?.trim();
        if (!token || !chatId) continue;
        const list = companiesByToken.get(token) ?? [];
        list.push({ id: company.id, name: company.name, telegramChatId: chatId });
        companiesByToken.set(token, list);
      }

      for (const [token, boundCompanies] of companiesByToken.entries()) {
        await this.pollSingleBot(token, boundCompanies);
      }
    } catch (err: unknown) {
      this.logger.debug(
        `Telegram polling cycle skipped: ${err instanceof Error ? err.message : 'unknown error'}`,
      );
    } finally {
      this.isPolling = false;
    }
  }
  private async pollSingleBot(
    botToken: string,
    boundCompanies: BoundCompanyTarget[],
  ): Promise<void> {
    const currentOffset = this.offsetsByToken.get(botToken);
    const params = new URLSearchParams({
      timeout: '0',
    });
    if (currentOffset !== undefined) {
      params.set('offset', String(currentOffset));
    }

    const path = `/bot${encodeURIComponent(botToken)}/getUpdates?${params.toString()}`;
    const response = await telegramHttpsRequest(path, 'GET');
    if (response.statusCode < 200 || response.statusCode >= 300) return;

    const payload = JSON.parse(response.body) as TelegramUpdatesResponse;
    if (!payload.ok || !Array.isArray(payload.result) || payload.result.length === 0) {
      return;
    }

    for (const update of payload.result) {
      this.offsetsByToken.set(botToken, update.update_id + 1);

      if (update.callback_query) {
        await this.handleCallbackQuery(botToken, update.callback_query, boundCompanies);
      } else if (update.message?.text) {
        await this.handleIncomingMessage(botToken, update.message, boundCompanies);
      }
    }
  }
  private async handleCallbackQuery(
    botToken: string,
    query: TelegramCallbackQuery,
    boundCompanies: BoundCompanyTarget[],
  ): Promise<void> {
    const chatId = query.message?.chat.id ? String(query.message.chat.id) : null;
    const targets = chatId
      ? boundCompanies.filter((item) => item.telegramChatId === chatId)
      : boundCompanies;
    const companiesToUpdate = targets.length > 0 ? targets : boundCompanies;
    if (companiesToUpdate.length === 0 || !query.data) return;

    const [action, orderId] = query.data.split(':');
    if (!orderId || (action !== 'order_confirm' && action !== 'order_cancel')) {
      return;
    }

    const nextStatus = action === 'order_confirm' ? 'CONFIRMED' : 'CANCELED';
    const sender = this.formatSenderName(query.from);
    let updatedAny = false;

    for (const company of companiesToUpdate) {
      await this.prisma.runSystemQuery(async () => {
        const existingOrder = await this.prisma.order.findFirst({
          where: { id: orderId, companyId: company.id },
          select: { id: true, status: true },
        });

        if (!existingOrder) return;
        updatedAny = true;

        await this.prisma.order.update({
          where: { id: existingOrder.id },
          data: { status: nextStatus },
        });

        await this.prisma.auditLog.create({
          data: {
            companyId: company.id,
            actorEmail: sender,
            action: 'TELEGRAM_ORDER_ACTION',
            entityType: 'Order',
            entityId: existingOrder.id,
            metadata: {
              source: 'telegram',
              sender,
              newStatus: nextStatus,
              summary:
                nextStatus === 'CONFIRMED'
                  ? `Замовлення підтверджено через Telegram (${sender})`
                  : `Замовлення скасовано через Telegram (${sender})`,
            } as Prisma.InputJsonValue,
          },
        });
      });
    }

    if (!updatedAny) {
      await this.answerCallbackQuery(botToken, query.id, 'Замовлення не знайдено в базі.');
      return;
    }

    const toastText =
      nextStatus === 'CONFIRMED'
        ? '✅ Замовлення підтверджено в NextOps!'
        : '❌ Замовлення скасовано в NextOps!';
    await this.answerCallbackQuery(botToken, query.id, toastText);

    if (chatId) {
      await this.sendMessage(
        botToken,
        chatId,
        `${toastText}\n🆔 <code>${orderId}</code>\n👤 <b>Виконав:</b> ${sender}`,
      ).catch(() => undefined);
    }
  }

  private async handleIncomingMessage(
    botToken: string,
    message: TelegramMessage,
    boundCompanies: BoundCompanyTarget[],
  ): Promise<void> {
    const chatId = String(message.chat.id);
    const targets = boundCompanies.filter((item) => item.telegramChatId === chatId);
    const companiesToNotify = targets.length > 0 ? targets : boundCompanies;
    const text = message.text?.trim();
    if (companiesToNotify.length === 0 || !text || text.startsWith('/start')) return;

    const sender = this.formatSenderName(message.from);
    const companyNames = companiesToNotify.map((c) => c.name).join(', ');
    this.logger.log(`Incoming Telegram message for [${companyNames}]: ${text}`);

    for (const company of companiesToNotify) {
      await this.prisma.runSystemQuery(() =>
        this.prisma.auditLog.create({
          data: {
            companyId: company.id,
            actorEmail: sender,
            action: 'TELEGRAM_INCOMING_MESSAGE',
            entityType: 'TelegramFeedback',
            entityId: String(message.message_id),
            metadata: {
              source: 'telegram',
              sender,
              text,
              summary: `${sender}: ${text}`,
            } as Prisma.InputJsonValue,
          },
        }),
      );
    }

    const primaryCompany = companiesToNotify[companiesToNotify.length - 1];
    await this.sendMessage(
      botToken,
      chatId,
      `📩 <b>Повідомлення передано в панель ${primaryCompany?.name ?? 'NextOps'}!</b>\nСповіщення вже з'явилося на екрані оператора.`,
    ).catch(() => undefined);
  }
}
