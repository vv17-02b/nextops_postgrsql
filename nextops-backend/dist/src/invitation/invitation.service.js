"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitationService = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_context_1 = require("../prisma/tenant-context");
const email_queue_service_1 = require("../common/queue/email-queue.service");
const password_hasher_1 = require("../auth/password-hasher");
const INVITATION_LIFETIME_MS = 48 * 60 * 60 * 1000;
let InvitationService = class InvitationService {
    constructor(prisma, tenantContext, emailQueue) {
        this.prisma = prisma;
        this.tenantContext = tenantContext;
        this.emailQueue = emailQueue;
    }
    async invite(dto, inviterRole) {
        const companyId = this.tenantContext.getCompanyId();
        if (!companyId)
            throw new common_1.ForbiddenException('A business workspace is required.');
        const email = dto.email.trim().toLowerCase();
        const existingUser = await this.prisma.user.findUnique({ where: { email } });
        if (existingUser)
            throw new common_1.ConflictException('An account with this email already exists.');
        const role = dto.role ?? 'MEMBER';
        if (inviterRole === 'ADMIN' && role === 'ADMIN') {
            throw new common_1.ForbiddenException('Only a workspace owner can invite administrators.');
        }
        const existingInvitation = await this.prisma.invitation.findFirst({
            where: { companyId, email, acceptedAt: null },
        });
        const token = (0, node_crypto_1.randomBytes)(32).toString('base64url');
        const tokenHash = (0, node_crypto_1.createHash)('sha256').update(token).digest('hex');
        const expiresAt = new Date(Date.now() + INVITATION_LIFETIME_MS);
        if (existingInvitation) {
            await this.prisma.invitation.update({
                where: { id: existingInvitation.id },
                data: { role, tokenHash, expiresAt },
            });
        }
        else {
            await this.prisma.invitation.create({
                data: { companyId, email, role, tokenHash, expiresAt },
            });
        }
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
            select: { name: true },
        });
        if (!company)
            throw new common_1.NotFoundException('The business workspace was not found.');
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
    async accept(dto) {
        const tokenHash = (0, node_crypto_1.createHash)('sha256').update(dto.token).digest('hex');
        const invitation = await this.prisma.invitation.findUnique({ where: { tokenHash } });
        if (!invitation || invitation.acceptedAt || invitation.expiresAt <= new Date()) {
            throw new common_1.NotFoundException('This invitation is invalid or has expired.');
        }
        this.tenantContext.setCompanyId(invitation.companyId);
        const passwordHash = await (0, password_hasher_1.hashPassword)(dto.password);
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
                throw new common_1.ConflictException('This invitation has already been accepted or expired.');
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
                            monthlyLimitMinor: 1000,
                            resetDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                        },
                    },
                },
            });
        });
        return { success: true };
    }
};
exports.InvitationService = InvitationService;
exports.InvitationService = InvitationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(prisma_service_1.PrismaService)),
    __param(1, (0, common_1.Inject)(tenant_context_1.TenantContext)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tenant_context_1.TenantContext,
        email_queue_service_1.EmailQueueService])
], InvitationService);
//# sourceMappingURL=invitation.service.js.map