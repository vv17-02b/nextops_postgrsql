import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { EmailQueueService } from '../common/queue/email-queue.service';
import type { CreateInvitationDto } from './dto/create-invitation.dto';
import type { AcceptInvitationDto } from './dto/accept-invitation.dto';
export declare class InvitationService {
    private readonly prisma;
    private readonly tenantContext;
    private readonly emailQueue;
    constructor(prisma: PrismaService, tenantContext: TenantContext, emailQueue: EmailQueueService);
    invite(dto: CreateInvitationDto, inviterRole: string): Promise<{
        success: true;
    }>;
    accept(dto: AcceptInvitationDto): Promise<{
        success: true;
    }>;
}
