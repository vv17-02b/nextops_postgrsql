import type { Queue } from 'bullmq';
export interface InvitationEmailJob {
    email: string;
    companyName: string;
    invitationUrl: string;
}
export declare class EmailQueueService {
    private readonly queue?;
    constructor(queue?: Queue<InvitationEmailJob> | undefined);
    enqueueInvitation(data: InvitationEmailJob): Promise<void>;
}
