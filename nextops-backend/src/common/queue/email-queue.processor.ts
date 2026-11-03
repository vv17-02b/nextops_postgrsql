import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { Job } from 'bullmq';
import nodemailer from 'nodemailer';
import type { InvitationEmailJob } from './email-queue.service';

@Injectable()
@Processor('email')
export class EmailQueueProcessor extends WorkerHost {
  async process(job: Job<InvitationEmailJob>): Promise<void> {
    const smtpUrl = process.env.SMTP_URL;
    const sender = process.env.EMAIL_FROM;
    if (!smtpUrl || !sender) {
      throw new ServiceUnavailableException('SMTP_URL and EMAIL_FROM are required to deliver email jobs.');
    }

    const transport = nodemailer.createTransport(smtpUrl);
    const isPasswordReset = job.data.companyName.startsWith('PASSWORD_RESET');
    await transport.sendMail({
      from: sender,
      to: job.data.email,
      subject: isPasswordReset
        ? 'Reset your NextOps password'
        : `Invitation to ${job.data.companyName}`,
      text: isPasswordReset
        ? `Use this link within 30 minutes to reset your password: ${job.data.invitationUrl}`
        : `You have been invited to join ${job.data.companyName}. Accept the invitation: ${job.data.invitationUrl}`,
    });
  }
}
