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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const node_crypto_1 = require("node:crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_context_1 = require("../prisma/tenant-context");
const auth_credentials_dto_1 = require("./dto/auth-credentials.dto");
const register_credentials_dto_1 = require("./dto/register-credentials.dto");
const public_decorator_1 = require("./public.decorator");
const password_hasher_1 = require("./password-hasher");
const cookie_session_1 = require("./cookie-session");
const token_revocation_service_1 = require("./token-revocation.service");
const password_recovery_dto_1 = require("./dto/password-recovery.dto");
const email_queue_service_1 = require("../common/queue/email-queue.service");
const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;
let AuthController = class AuthController {
    constructor(prisma, jwtService, tenantContext, tokenRevocation, emailQueue) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.tenantContext = tenantContext;
        this.tokenRevocation = tokenRevocation;
        this.emailQueue = emailQueue;
    }
    async register(dto, request) {
        const email = dto.email.trim().toLowerCase();
        const exists = await this.prisma.user.findUnique({ where: { email } });
        if (exists)
            throw new common_1.ConflictException('An account with this email already exists.');
        const passwordHash = await (0, password_hasher_1.hashPassword)(dto.password);
        const result = await this.prisma.$transaction(async (tx) => {
            const company = await tx.company.create({
                data: { name: `${email.split('@')[0]}'s workspace` },
            });
            const user = await tx.user.create({
                data: {
                    email,
                    passwordHash,
                    role: 'OWNER',
                    companyId: company.id,
                },
            });
            await tx.userAiBudget.create({
                data: {
                    userId: user.id,
                    companyId: company.id,
                    monthlyLimitMinor: 1000,
                    resetDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                },
            });
            return {
                success: true,
                message: 'Business workspace created. Sign in to continue.',
                userId: user.id,
                companyId: company.id,
            };
        });
        this.tenantContext.setCompanyId(result.companyId);
        request.user = { id: result.userId };
        return result;
    }
    async login(dto, response) {
        const email = dto.email.trim().toLowerCase();
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) {
            throw new common_1.UnauthorizedException('Invalid email or password.');
        }
        const verification = await (0, password_hasher_1.verifyPassword)(dto.password, user.passwordHash);
        if (!verification.valid) {
            throw new common_1.UnauthorizedException('Invalid email or password.');
        }
        if (!user.companyId) {
            throw new common_1.UnauthorizedException('This account has no business workspace. Contact an administrator to migrate it.');
        }
        this.tenantContext.setCompanyId(user.companyId);
        if (verification.needsRehash) {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { passwordHash: await (0, password_hasher_1.hashPassword)(dto.password) },
            });
        }
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            epoch: await this.tokenRevocation.getSessionEpoch(user.id),
        };
        const token = this.jwtService.sign(payload);
        response.cookie(cookie_session_1.SESSION_COOKIE, token, (0, cookie_session_1.sessionCookieOptions)());
        return {
            success: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                companyId: user.companyId,
            },
        };
    }
    csrf(request, response) {
        const csrfToken = request.csrfToken ?? (0, cookie_session_1.readCookie)(request, cookie_session_1.CSRF_COOKIE) ?? (0, node_crypto_1.randomBytes)(32).toString('base64url');
        response.cookie(cookie_session_1.CSRF_COOKIE, csrfToken, (0, cookie_session_1.csrfCookieOptions)());
        return { csrfToken };
    }
    currentUser(request) {
        return { user: request.user };
    }
    async logout(request, response) {
        const token = token_revocation_service_1.TokenRevocationService.extractToken(request);
        if (token) {
            try {
                const payload = this.jwtService.decode(token);
                const expiresAtMs = payload?.exp ? payload.exp * 1000 : Date.now();
                await this.tokenRevocation.revokeToken(token, expiresAtMs);
            }
            catch {
            }
        }
        response.clearCookie(cookie_session_1.SESSION_COOKIE, (0, cookie_session_1.clearedSessionCookieOptions)());
        return { success: true };
    }
    async forgotPassword(dto) {
        const email = dto.email.trim().toLowerCase();
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return { success: true, message: 'If the account exists, a reset link has been sent.' };
        }
        const token = (0, node_crypto_1.randomBytes)(32).toString('base64url');
        const tokenHash = (0, node_crypto_1.createHash)('sha256').update(token).digest('hex');
        const expires = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
        await this.prisma.verificationToken.create({
            data: {
                companyId: user.companyId,
                identifier: user.email ?? email,
                token: tokenHash,
                expires,
            },
        });
        const resetUrl = new URL('/reset-password', process.env.FRONTEND_URL ?? 'http://localhost:3000');
        resetUrl.searchParams.set('token', token);
        try {
            await this.emailQueue.enqueueInvitation({
                email,
                companyName: `PASSWORD_RESET:${user.companyId ?? ''}`,
                invitationUrl: resetUrl.toString(),
            });
        }
        catch {
        }
        return { success: true, message: 'If the account exists, a reset link has been sent.' };
    }
    async resetPassword(dto) {
        const tokenHash = (0, node_crypto_1.createHash)('sha256').update(dto.token).digest('hex');
        const record = await this.prisma.verificationToken.findUnique({ where: { token: tokenHash } });
        if (!record || record.expires.getTime() < Date.now()) {
            throw new common_1.UnauthorizedException('This password reset link is invalid or has expired.');
        }
        const user = await this.prisma.user.findFirst({
            where: { email: record.identifier },
            select: { id: true },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('This password reset link is invalid or has expired.');
        }
        const passwordHash = await (0, password_hasher_1.hashPassword)(dto.password);
        await this.prisma.$transaction([
            this.prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
            this.prisma.verificationToken.delete({ where: { token: tokenHash } }),
        ]);
        await this.tokenRevocation.bumpSessionEpoch(user.id);
        return { success: true };
    }
    async logoutAll(request, response) {
        await this.tokenRevocation.bumpSessionEpoch(request.user.id);
        const token = token_revocation_service_1.TokenRevocationService.extractToken(request);
        if (token) {
            try {
                const payload = this.jwtService.decode(token);
                await this.tokenRevocation.revokeToken(token, payload?.exp ? payload.exp * 1000 : Date.now());
            }
            catch {
            }
        }
        response.clearCookie(cookie_session_1.SESSION_COOKIE, (0, cookie_session_1.clearedSessionCookieOptions)());
        return { success: true };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_credentials_dto_1.RegisterCredentialsDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_credentials_dto_1.AuthCredentialsDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('csrf'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Object)
], AuthController.prototype, "csrf", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], AuthController.prototype, "currentUser", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [password_recovery_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [password_recovery_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Post)('logout-all'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logoutAll", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __param(0, (0, common_1.Inject)(prisma_service_1.PrismaService)),
    __param(1, (0, common_1.Inject)(jwt_1.JwtService)),
    __param(2, (0, common_1.Inject)(tenant_context_1.TenantContext)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        tenant_context_1.TenantContext,
        token_revocation_service_1.TokenRevocationService,
        email_queue_service_1.EmailQueueService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map