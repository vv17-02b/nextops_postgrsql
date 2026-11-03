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
exports.OrderService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_context_1 = require("../prisma/tenant-context");
const paginate_1 = require("../common/pagination/paginate");
const client_1 = require("@prisma/client");
const money_1 = require("../common/money");
let OrderService = class OrderService {
    constructor(prisma, tenantContext) {
        this.prisma = prisma;
        this.tenantContext = tenantContext;
    }
    async create(dto, userId) {
        const companyId = this.tenantContext.getCompanyId();
        if (!companyId)
            throw new common_1.ForbiddenException('A business workspace is required.');
        return this.prisma.$transaction(async (transaction) => {
            const requestedProductIds = [...new Set(dto.items.map((item) => item.productId))];
            const products = await transaction.product.findMany({
                where: { id: { in: requestedProductIds }, isActive: true },
                select: { id: true, priceMinor: true },
            });
            if (products.length !== requestedProductIds.length) {
                throw new common_1.NotFoundException('One or more products are unavailable in this workspace.');
            }
            const productPrices = new Map(products.map((product) => [product.id, product.priceMinor]));
            const items = dto.items.map((item) => {
                const priceMinor = productPrices.get(item.productId);
                if (priceMinor === undefined) {
                    throw new common_1.NotFoundException('One or more products are unavailable in this workspace.');
                }
                return {
                    companyId,
                    productId: item.productId,
                    quantity: item.quantity,
                    priceMinor,
                };
            });
            const totalAmountMinor = items.reduce((total, item) => total + item.quantity * item.priceMinor, 0);
            if (!Number.isSafeInteger(totalAmountMinor) || totalAmountMinor > money_1.MAX_MINOR_UNITS) {
                throw new common_1.BadRequestException('The calculated order amount exceeds the supported range.');
            }
            return transaction.order.create({
                data: {
                    companyId,
                    userId,
                    totalAmountMinor,
                    currency: dto.currency || 'UAH',
                    shippingAddress: dto.shippingAddress
                        ? dto.shippingAddress
                        : {},
                    status: 'PENDING',
                    paymentStatus: 'UNPAID',
                    paymentMethod: 'CARD',
                    items: items.length ? { create: items } : undefined,
                },
                include: { items: true },
            });
        }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
    }
    async findAll(query) {
        return (0, paginate_1.paginate)(query, (skip, take) => this.prisma.order.findMany({
            skip,
            take,
            include: { items: true },
        }), () => this.prisma.order.count());
    }
    async findOne(id) {
        const item = await this.prisma.order.findUnique({
            where: { id },
            include: { items: true },
        });
        if (!item)
            throw new common_1.NotFoundException(`Документ не знайдено`);
        return item;
    }
    async update(id, dto) {
        await this.findOne(id);
        const updateData = {};
        if (dto.status)
            updateData.status = dto.status;
        if (dto.shippingAddress) {
            updateData.shippingAddress = dto.shippingAddress;
        }
        return this.prisma.order.update({
            where: { id },
            data: updateData,
            include: { items: true },
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.order.delete({ where: { id } });
    }
};
exports.OrderService = OrderService;
exports.OrderService = OrderService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(prisma_service_1.PrismaService)),
    __param(1, (0, common_1.Inject)(tenant_context_1.TenantContext)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tenant_context_1.TenantContext])
], OrderService);
//# sourceMappingURL=order.service.js.map