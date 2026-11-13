import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface OrderTelegramSummary {
  orderId: string;
  totalAmountMinor: number;
  currency: string;
  itemsCount: number;
  status: string;
}

@Injectable()
export class TelegramNotifierService {
  private readonly logger = new Logger(TelegramNotifierService.name);

  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async sendMessage(botToken: string, chatId: string, text: string): Promise<boolean> {
    const endpoint = `https://api.telegram.org/bot${encodeURIComponent(botToken)}/sendMessage`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Telegram API HTTP ${response.status}: ${errText}`);
    }
    return true;
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
    ].join('\n');

    try {
      await this.sendMessage(company.telegramBotToken, company.telegramChatId, message);
    } catch (err: unknown) {
      this.logger.warn(
        `Failed to deliver Telegram notification for company ${companyId}: ${err instanceof Error ? err.message : 'unknown error'}`,
      );
    }
  }
}
