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
exports.AgentKnowledgeBaseService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_context_1 = require("../prisma/tenant-context");
const paginate_1 = require("../common/pagination/paginate");
let AgentKnowledgeBaseService = class AgentKnowledgeBaseService {
    constructor(prisma, tenantContext) {
        this.prisma = prisma;
        this.tenantContext = tenantContext;
    }
    async executeAiTask(userId, estimatedCostMinor, taskPayload) {
        if (!Number.isSafeInteger(estimatedCostMinor) || estimatedCostMinor <= 0) {
            throw new common_1.BadRequestException('Estimated cost must be a positive integer number of minor units.');
        }
        const budget = await this.prisma.userAiBudget.findFirst({
            where: { userId },
        });
        if (!budget) {
            throw new common_1.NotFoundException(`FinOps Error: Для користувача з ID ${userId} не знайдено активного ШІ-гаманця`);
        }
        const charged = await this.prisma.userAiBudget.updateMany({
            where: {
                id: budget.id,
                currentUsageMinor: { lte: budget.monthlyLimitMinor - estimatedCostMinor },
            },
            data: {
                currentUsageMinor: { increment: estimatedCostMinor },
            },
        });
        if (charged.count !== 1) {
            throw new common_1.ForbiddenException('The AI budget limit has been reached.');
        }
        const mockAiResponse = `Processed task: "${taskPayload}". AI tokens validated by NextOps engine core.`;
        return {
            success: true,
            aiResponse: mockAiResponse,
        };
    }
    async create(dto) {
        const companyId = this.tenantContext.getCompanyId();
        if (!companyId)
            throw new common_1.ForbiddenException('A business workspace is required.');
        return this.prisma.agentKnowledgeBase.create({ data: { ...dto, companyId } });
    }
    async findAll(query) {
        return (0, paginate_1.paginate)(query, (skip, take) => this.prisma.agentKnowledgeBase.findMany({ skip, take }), () => this.prisma.agentKnowledgeBase.count());
    }
    async findOne(id) {
        const item = await this.prisma.agentKnowledgeBase.findUnique({ where: { id } });
        if (!item)
            throw new common_1.NotFoundException(`Документ бази знань з ID ${id} не знайдено`);
        return item;
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.agentKnowledgeBase.update({
            where: { id },
            data: dto,
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.agentKnowledgeBase.delete({ where: { id } });
    }
};
exports.AgentKnowledgeBaseService = AgentKnowledgeBaseService;
exports.AgentKnowledgeBaseService = AgentKnowledgeBaseService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(prisma_service_1.PrismaService)),
    __param(1, (0, common_1.Inject)(tenant_context_1.TenantContext)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tenant_context_1.TenantContext])
], AgentKnowledgeBaseService);
//# sourceMappingURL=agentknowledgebase.service.js.map