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
exports.VerificationTokenService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_context_1 = require("../prisma/tenant-context");
const paginate_1 = require("../common/pagination/paginate");
let VerificationTokenService = class VerificationTokenService {
    constructor(prisma, tenantContext) {
        this.prisma = prisma;
        this.tenantContext = tenantContext;
    }
    async create(dto) {
        if (!this.prisma || !this.prisma.verificationToken) {
            throw new Error('Критична помилка: PrismaService не ініціалізовано.');
        }
        let parsedDate = new Date(dto.expires);
        if (isNaN(parsedDate.getTime())) {
            parsedDate = new Date();
            parsedDate.setDate(parsedDate.getDate() + 1);
        }
        try {
            const companyId = this.tenantContext.getCompanyId();
            if (!companyId)
                throw new common_1.ForbiddenException('A business workspace is required.');
            return await this.prisma.verificationToken.create({
                data: {
                    companyId,
                    identifier: dto.identifier.trim(),
                    token: dto.token.trim(),
                    expires: parsedDate,
                },
            });
        }
        catch {
            throw new common_1.BadRequestException('Could not save the verification token.');
        }
    }
    async findAll(query) {
        if (!this.prisma || !this.prisma.verificationToken) {
            throw new Error('Критична помилка: PrismaService не ініціалізовано.');
        }
        return (0, paginate_1.paginate)(query, (skip, take) => this.prisma.verificationToken.findMany({ skip, take }), () => this.prisma.verificationToken.count());
    }
    async findOne(id) {
        const item = await this.prisma.verificationToken.findUnique({ where: { id } });
        if (!item) {
            throw new common_1.NotFoundException('Токен верифікації не знайдено');
        }
        return item;
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.verificationToken.update({
            where: { id },
            data: {
                identifier: dto.identifier,
                token: dto.token,
                expires: dto.expires ? new Date(dto.expires) : undefined,
            },
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.verificationToken.delete({ where: { id } });
    }
};
exports.VerificationTokenService = VerificationTokenService;
exports.VerificationTokenService = VerificationTokenService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(prisma_service_1.PrismaService)),
    __param(1, (0, common_1.Inject)(tenant_context_1.TenantContext)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tenant_context_1.TenantContext])
], VerificationTokenService);
//# sourceMappingURL=verificationtoken.service.js.map