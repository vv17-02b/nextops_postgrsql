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
exports.SessionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_context_1 = require("../prisma/tenant-context");
const paginate_1 = require("../common/pagination/paginate");
let SessionService = class SessionService {
    constructor(prisma, tenantContext) {
        this.prisma = prisma;
        this.tenantContext = tenantContext;
    }
    async create(dto) {
        const companyId = this.tenantContext.getCompanyId();
        if (!companyId)
            throw new common_1.ForbiddenException('A business workspace is required.');
        let sessionExpires = dto.expires ? new Date(dto.expires) : null;
        if (!sessionExpires || isNaN(sessionExpires.getTime())) {
            sessionExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        }
        return this.prisma.session.create({
            data: {
                sessionToken: dto.sessionToken,
                companyId,
                userId: dto.userId,
                expires: sessionExpires,
            },
        });
    }
    async findAll(query) {
        return (0, paginate_1.paginate)(query, (skip, take) => this.prisma.session.findMany({ skip, take }), () => this.prisma.session.count());
    }
    async findOne(id) {
        const item = await this.prisma.session.findUnique({ where: { id } });
        if (!item)
            throw new common_1.NotFoundException(`Сесію з ID ${id} не знайдено`);
        return item;
    }
    async update(id, dto) {
        await this.findOne(id);
        const updateData = {};
        if (dto.sessionToken)
            updateData.sessionToken = dto.sessionToken;
        if (dto.userId)
            updateData.userId = dto.userId;
        if (dto.expires) {
            const parsedDate = new Date(dto.expires);
            if (!isNaN(parsedDate.getTime())) {
                updateData.expires = parsedDate;
            }
        }
        return this.prisma.session.update({
            where: { id },
            data: updateData,
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.session.delete({ where: { id } });
    }
};
exports.SessionService = SessionService;
exports.SessionService = SessionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(prisma_service_1.PrismaService)),
    __param(1, (0, common_1.Inject)(tenant_context_1.TenantContext)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tenant_context_1.TenantContext])
], SessionService);
//# sourceMappingURL=session.service.js.map