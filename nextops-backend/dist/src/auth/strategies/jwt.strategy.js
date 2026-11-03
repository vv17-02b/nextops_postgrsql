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
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const prisma_service_1 = require("../../prisma/prisma.service");
const tenant_context_1 = require("../../prisma/tenant-context");
const jwt_secret_1 = require("../jwt-secret");
const cookie_session_1 = require("../cookie-session");
const token_revocation_service_1 = require("../token-revocation.service");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    constructor(prisma, tenantContext, tokenRevocation) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromExtractors([
                (request) => {
                    if (!request)
                        return null;
                    const token = (0, cookie_session_1.readCookie)(request, cookie_session_1.SESSION_COOKIE) ??
                        passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken()(request);
                    if (token)
                        request.rawToken = token;
                    return token;
                },
            ]),
            ignoreExpiration: false,
            secretOrKey: jwt_secret_1.jwtSecret,
        });
        this.prisma = prisma;
        this.tenantContext = tenantContext;
        this.tokenRevocation = tokenRevocation;
    }
    async validate(payload, request) {
        if (!payload.sub)
            throw new common_1.UnauthorizedException('Invalid authentication token.');
        if (request?.rawToken) {
            const revoked = await this.tokenRevocation.isTokenRevoked(request.rawToken);
            if (revoked)
                throw new common_1.UnauthorizedException('This session has been revoked.');
            const currentEpoch = await this.tokenRevocation.getSessionEpoch(payload.sub);
            if ((payload.epoch ?? 0) < currentEpoch) {
                throw new common_1.UnauthorizedException('This session has been revoked.');
            }
        }
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, email: true, companyId: true, role: true },
        });
        if (!user)
            throw new common_1.UnauthorizedException('The account is no longer available.');
        if (!user.companyId) {
            throw new common_1.ForbiddenException('This account is not assigned to a business workspace.');
        }
        this.tenantContext.setCompanyId(user.companyId);
        return {
            ...user,
            role: user.role === 'USER' ? 'MEMBER' : user.role,
            companyId: user.companyId,
        };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(prisma_service_1.PrismaService)),
    __param(1, (0, common_1.Inject)(tenant_context_1.TenantContext)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tenant_context_1.TenantContext,
        token_revocation_service_1.TokenRevocationService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map