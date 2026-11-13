import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { deliverWebhookHttp, type WebhookDeliveryJob } from './webhook-queue.service';

@Processor('webhook')
export class WebhookQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookQueueProcessor.name);

  async process(job: Job<WebhookDeliveryJob>): Promise<void> {
    this.logger.log(
      `Delivering webhook event "${job.data.event}" to ${job.data.url} (attempt ${job.attemptsMade + 1})`,
    );
    await deliverWebhookHttp(job.data);
  }
}
