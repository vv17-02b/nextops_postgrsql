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
exports.UserAiBudgetService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_context_1 = require("../prisma/tenant-context");
const paginate_1 = require("../common/pagination/paginate");
const CENTS_PER_UNIT = 100;
function toMinor(value) {
    if (!Number.isFinite(value)) {
        throw new common_1.ForbiddenException('Budget values must be finite numbers.');
    }
    const minor = Math.round(value * CENTS_PER_UNIT);
    if (!Number.isSafeInteger(minor) || minor < 0) {
        throw new common_1.ForbiddenException('Budget value is out of the supported minor-unit range.');
    }
    return minor;
}
let UserAiBudgetService = class UserAiBudgetService {
    constructor(prisma, tenantContext) {
        this.prisma = prisma;
        this.tenantContext = tenantContext;
    }
    async create(dto) {
        const companyId = this.tenantContext.getCompanyId();
        if (!companyId)
            throw new common_1.ForbiddenException('A business workspace is required.');
        const autoResetDate = new Date();
        autoResetDate.setDate(autoResetDate.getDate() + 30);
        const budgetData = {
            companyId,
            userId: String(dto.userId).trim(),
            monthlyLimitMinor: toMinor(dto.totalBudgetMinor),
            currentUsageMinor: toMinor(dto.usedBudgetMinor ?? 0),
            resetDate: autoResetDate,
        };
        return this.prisma.userAiBudget.create({
            data: budgetData,
        });
    }
    async findAll(query) {
        return (0, paginate_1.paginate)(query, async (skip, take) => {
            const budgets = await this.prisma.userAiBudget.findMany({ skip, take });
            return budgets.map((item) => ({
                ...item,
                totalBudgetMinor: item.monthlyLimitMinor,
                usedBudgetMinor: item.currentUsageMinor,
                currency: 'USD',
            }));
        }, () => this.prisma.userAiBudget.count());
    }
    async findOne(id) {
        const item = await this.prisma.userAiBudget.findUnique({ where: { id } });
        if (!item)
            throw new common_1.NotFoundException(`Бюджет з ID ${id} не знайдено`);
        return {
            ...item,
            totalBudgetMinor: item.monthlyLimitMinor,
            usedBudgetMinor: item.currentUsageMinor,
            currency: 'USD',
        };
    }
    async update(id, dto) {
        await this.findOne(id);
        const updateData = {};
        if (dto.userId)
            updateData.userId = dto.userId;
        if (dto.totalBudgetMinor !== undefined)
            updateData.monthlyLimitMinor = toMinor(dto.totalBudgetMinor);
        if (dto.usedBudgetMinor !== undefined)
            updateData.currentUsageMinor = toMinor(dto.usedBudgetMinor);
        return this.prisma.userAiBudget.update({
            where: { id },
            data: updateData,
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.userAiBudget.delete({ where: { id } });
    }
};
exports.UserAiBudgetService = UserAiBudgetService;
exports.UserAiBudgetService = UserAiBudgetService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(prisma_service_1.PrismaService)),
    __param(1, (0, common_1.Inject)(tenant_context_1.TenantContext)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tenant_context_1.TenantContext])
], UserAiBudgetService);
//# sourceMappingURL=useraibudget.service.js.map