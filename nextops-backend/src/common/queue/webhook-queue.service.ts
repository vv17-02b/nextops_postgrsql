import { createHmac, randomUUID } from 'node:crypto';
import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';

export interface WebhookDeliveryJob {
  configId: string;
  companyId: string;
  url: string;
  secret: string;
  event: string;
  payload: Record<string, unknown>;
}

/**
 * Генерує криптографічний підпис стандарту SaaS (як у Stripe):
 * X-NextOps-Signature: t=<unix_seconds>,v1=<HMAC-SHA256(timestamp + "." + rawBody)>
 */
export function signWebhookPayload(
  rawBody: string,
  secret: string,
  timestampSeconds = Math.floor(Date.now() / 1000),
): string {
  const signedPayload = `${timestampSeconds}.${rawBody}`;
  const digest = createHmac('sha256', secret).update(signedPayload).digest('hex');
  return `t=${timestampSeconds},v1=${digest}`;
}

export async function deliverWebhookHttp(job: WebhookDeliveryJob): Promise<void> {
  const deliveryId = randomUUID();
  const body = JSON.stringify({
    id: deliveryId,
    event: job.event,
    companyId: job.companyId,
    timestamp: new Date().toISOString(),
    data: job.payload,
  });

  const response = await fetch(job.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-NextOps-Event': job.event,
      'X-NextOps-Delivery-Id': deliveryId,
      'X-NextOps-Signature': signWebhookPayload(body, job.secret),
    },
    body,
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Webhook target responded with HTTP ${response.status}`);
  }
}

@Injectable()
export class WebhookQueueService {
  private readonly logger = new Logger(WebhookQueueService.name);

  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Optional()
    @InjectQueue('webhook')
    private readonly webhookQueue?: Queue<WebhookDeliveryJob>,
  ) {}

  async dispatchCompanyEvent(
    companyId: string,
    event: string,
    payload: Record<string, unknown>,
  ): Promise<number> {
    const configs = await this.prisma.runSystemQuery(() =>
      this.prisma.webhookConfig.findMany({
        where: { companyId, isActive: true },
        select: { id: true, url: true, secret: true, events: true },
      }),
    );

    const matching = configs.filter(
      (cfg) => cfg.events.length === 0 || cfg.events.includes(event) || cfg.events.includes('*'),
    );

    if (matching.length === 0) return 0;

    for (const cfg of matching) {
      const jobData: WebhookDeliveryJob = {
        configId: cfg.id,
        companyId,
        url: cfg.url,
        secret: cfg.secret,
        event,
        payload,
      };

      if (this.webhookQueue) {
        await this.webhookQueue.add('deliver-webhook', jobData, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5_000 },
          removeOnComplete: 200,
          removeOnFail: 500,
        });
      } else {
        void deliverWebhookHttp(jobData).catch((err: unknown) => {
          this.logger.warn(
            `Fallback webhook delivery failed for ${cfg.url}: ${err instanceof Error ? err.message : 'unknown error'}`,
          );
        });
      }
    }

    return matching.length;
  }
}
