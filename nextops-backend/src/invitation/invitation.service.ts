import { createHash, randomBytes } from 'node:crypto';
import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { EmailQueueService } from '../common/queue/email-queue.service';
import { hashPassword } from '../auth/password-hasher';
import type { CreateInvitationDto } from './dto/create-invitation.dto';
import type { AcceptInvitationDto } from './dto/accept-invitation.dto';

const INVITATION_LIFETIME_MS = 48 * 60 * 60 * 1000;

@Injectable()
export class InvitationService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(TenantContext) private readonly tenantContext: TenantContext,
    private readonly emailQueue: EmailQueueService,
  ) {}

  async invite(dto: CreateInvitationDto, inviterRole: string): Promise<{ success: true }> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) throw new ForbiddenException('A business workspace is required.');

    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new ConflictException('An account with this email already exists.');

    const role = dto.role ?? 'MEMBER';
    if (inviterRole === 'ADMIN' && role === 'ADMIN') {
      throw new ForbiddenException('Only a workspace owner can invite administrators.');
    }

    const existingInvitation = await this.prisma.invitation.findFirst({
      where: { companyId, email, acceptedAt: null },
    });
    const token = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + INVITATION_LIFETIME_MS);

    if (existingInvitation) {
      await this.prisma.invitation.update({
        where: { id: existingInvitation.id },
        data: { role, tokenHash, expiresAt },
      });
    } else {
      await this.prisma.invitation.create({
        data: { companyId, email, role, tokenHash, expiresAt },
      });
    }

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true },
    });
    if (!company) throw new NotFoundException('The business workspace was not found.');

    const frontendUrl = process.env.FRONTEND_URL;
    if (process.env.NODE_ENV === 'production' && !frontendUrl) {
      throw new Error('FRONTEND_URL must be configured to send invitations in production.');
    }
    const invitationUrl = new URL('/invite', frontendUrl ?? 'http://localhost:3000');
    invitationUrl.searchParams.set('token', token);
    await this.emailQueue.enqueueInvitation({
      email,
      companyName: company.name,
      invitationUrl: invitationUrl.toString(),
    });
    return { success: true };
  }

  async accept(dto: AcceptInvitationDto): Promise<{ success: true }> {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    const invitation = await this.prisma.invitation.findUnique({ where: { tokenHash } });
    if (!invitation || invitation.acceptedAt || invitation.expiresAt <= new Date()) {
      throw new NotFoundException('This invitation is invalid or has expired.');
    }

    this.tenantContext.setCompanyId(invitation.companyId);
    const passwordHash = await hashPassword(dto.password);
    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.invitation.updateMany({
        where: {
          id: invitation.id,
          companyId: invitation.companyId,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { acceptedAt: new Date() },
      });
      if (claimed.count !== 1) {
        throw new ConflictException('This invitation has already been accepted or expired.');
      }

      await tx.user.create({
        data: {
          email: invitation.email,
          passwordHash,
          role: invitation.role,
          companyId: invitation.companyId,
          aiBudgets: {
            create: {
              company: { connect: { id: invitation.companyId } },
              monthlyLimitMinor: 1000, // $10.00
              resetDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
            },
          },
        },
      });
    });
    return { success: true };
  }
}
