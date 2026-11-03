import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Optional, ServiceUnavailableException } from '@nestjs/common';
import type { Queue } from 'bullmq';

export interface InvitationEmailJob {
  email: string;
  companyName: string;
  invitationUrl: string;
}

@Injectable()
export class EmailQueueService {
  constructor(
    @Optional() @InjectQueue('email') private readonly queue?: Queue<InvitationEmailJob>,
  ) {}

  async enqueueInvitation(data: InvitationEmailJob): Promise<void> {
    if (!process.env.REDIS_URL || !this.queue) {
      throw new ServiceUnavailableException('Redis-backed email delivery is not configured.');
    }
    if (!process.env.SMTP_URL || !process.env.EMAIL_FROM) {
      throw new ServiceUnavailableException('SMTP_URL and EMAIL_FROM are required to deliver email jobs.');
    }
    await this.queue.add('invitation', data, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 2_000 },
      removeOnComplete: 1_000,
      removeOnFail: 5_000,
    });
  }
}
