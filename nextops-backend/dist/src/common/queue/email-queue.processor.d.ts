import { WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import type { InvitationEmailJob } from './email-queue.service';
export declare class EmailQueueProcessor extends WorkerHost {
    process(job: Job<InvitationEmailJob>): Promise<void>;
}
