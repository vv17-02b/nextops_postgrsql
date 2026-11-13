import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import type { QueueOptions } from 'bullmq';
import { EmailQueueProcessor } from './email-queue.processor';
import { EmailQueueService } from './email-queue.service';
import { WebhookQueueProcessor } from './webhook-queue.processor';
import { WebhookQueueService } from './webhook-queue.service';
import { TelegramNotifierService } from './telegram-notifier.service';

function redisConnection(): NonNullable<QueueOptions['connection']> {
  const url = new URL(process.env.REDIS_URL ?? 'redis://127.0.0.1:6379');
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : url.protocol === 'rediss:' ? 6380 : 6379,
    ...(url.username ? { username: decodeURIComponent(url.username) } : {}),
    ...(url.password ? { password: decodeURIComponent(url.password) } : {}),
    ...(url.pathname.length > 1 ? { db: Number(url.pathname.slice(1)) } : {}),
    ...(url.protocol === 'rediss:' ? { tls: {} } : {}),
    maxRetriesPerRequest: null,
  };
}

const queueEnabled = Boolean(process.env.REDIS_URL);
const queueImports = queueEnabled
  ? [
      BullModule.forRoot({ connection: redisConnection() }),
      BullModule.registerQueue({ name: 'email' }, { name: 'webhook' }),
    ]
  : [];

@Global()
@Module({
  imports: queueImports,
  providers: queueEnabled
    ? [
        EmailQueueService,
        EmailQueueProcessor,
        WebhookQueueService,
        WebhookQueueProcessor,
        TelegramNotifierService,
      ]
    : [EmailQueueService, WebhookQueueService, TelegramNotifierService],
  exports: [EmailQueueService, WebhookQueueService, TelegramNotifierService],
})
export class QueueModule {}
