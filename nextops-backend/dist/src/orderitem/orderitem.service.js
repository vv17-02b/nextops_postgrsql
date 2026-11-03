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
exports.OrderItemService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const money_1 = require("../common/money");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_context_1 = require("../prisma/tenant-context");
const paginate_1 = require("../common/pagination/paginate");
let OrderItemService = class OrderItemService {
    constructor(prisma, tenantContext) {
        this.prisma = prisma;
        this.tenantContext = tenantContext;
    }
    async create(dto) {
        const companyId = this.tenantContext.getCompanyId();
        if (!companyId)
            throw new common_1.ForbiddenException('A business workspace is required.');
        return this.prisma.$transaction(async (transaction) => {
            const [order, product] = await Promise.all([
                transaction.order.findFirst({
                    where: { id: dto.orderId, paymentStatus: 'UNPAID' },
                    select: { id: true, totalAmountMinor: true },
                }),
                transaction.product.findFirst({
                    where: { id: dto.productId, isActive: true },
                    select: { id: true, priceMinor: true },
                }),
            ]);
            if (!order)
                throw new common_1.NotFoundException('An unpaid order was not found in this workspace.');
            if (!product)
                throw new common_1.NotFoundException('An active product was not found in this workspace.');
            const lineTotal = dto.quantity * product.priceMinor;
            if (!Number.isSafeInteger(lineTotal) || order.totalAmountMinor + lineTotal > money_1.MAX_MINOR_UNITS) {
                throw new common_1.BadRequestException('The order item amount exceeds the supported range.');
            }
            const updatedOrder = await transaction.order.updateMany({
                where: { id: order.id, paymentStatus: 'UNPAID' },
                data: { totalAmountMinor: { increment: lineTotal } },
            });
            if (updatedOrder.count !== 1) {
                throw new common_1.BadRequestException('Items cannot be added to a paid order.');
            }
            return transaction.orderItem.create({
                data: {
                    companyId,
                    orderId: order.id,
                    productId: product.id,
                    quantity: dto.quantity,
                    priceMinor: product.priceMinor,
                },
            });
        }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
    }
    async findAll(query) {
        if (!this.prisma || !this.prisma.orderItem) {
            throw new Error('Критична помилка: PrismaService не ініціалізовано.');
        }
        return (0, paginate_1.paginate)(query, (skip, take) => this.prisma.orderItem.findMany({ skip, take }), () => this.prisma.orderItem.count());
    }
    async findOne(id) {
        const item = await this.prisma.orderItem.findUnique({ where: { id } });
        if (!item) {
            throw new common_1.NotFoundException('Елемент замовлення не знайдено');
        }
        return item;
    }
    async update(id, dto) {
        return this.prisma.$transaction(async (transaction) => {
            const item = await transaction.orderItem.findUnique({ where: { id } });
            if (!item)
                throw new common_1.NotFoundException('Елемент замовлення не знайдено');
            const order = await transaction.order.findFirst({
                where: { id: item.orderId, paymentStatus: 'UNPAID' },
                select: { id: true, totalAmountMinor: true },
            });
            if (!order)
                throw new common_1.BadRequestException('Items cannot be changed on a paid order.');
            const quantity = dto.quantity ?? item.quantity;
            const amountChange = (quantity - item.quantity) * item.priceMinor;
            const newTotal = order.totalAmountMinor + amountChange;
            if (!Number.isSafeInteger(newTotal) || newTotal < 0 || newTotal > money_1.MAX_MINOR_UNITS) {
                throw new common_1.BadRequestException('The updated order amount exceeds the supported range.');
            }
            const updatedOrder = await transaction.order.updateMany({
                where: { id: order.id, paymentStatus: 'UNPAID' },
                data: { totalAmountMinor: { increment: amountChange } },
            });
            if (updatedOrder.count !== 1) {
                throw new common_1.BadRequestException('Items cannot be changed on a paid order.');
            }
            return transaction.orderItem.update({
                where: { id },
                data: { quantity },
            });
        }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
    }
    async remove(id) {
        return this.prisma.$transaction(async (transaction) => {
            const item = await transaction.orderItem.findUnique({ where: { id } });
            if (!item)
                throw new common_1.NotFoundException('Елемент замовлення не знайдено');
            const order = await transaction.order.findFirst({
                where: { id: item.orderId, paymentStatus: 'UNPAID' },
                select: { id: true, totalAmountMinor: true },
            });
            if (!order)
                throw new common_1.BadRequestException('Items cannot be removed from a paid order.');
            const itemTotal = item.quantity * item.priceMinor;
            if (order.totalAmountMinor < itemTotal) {
                throw new common_1.BadRequestException('The order total is inconsistent with its items.');
            }
            const updatedOrder = await transaction.order.updateMany({
                where: { id: order.id, paymentStatus: 'UNPAID' },
                data: { totalAmountMinor: { decrement: itemTotal } },
            });
            if (updatedOrder.count !== 1) {
                throw new common_1.BadRequestException('Items cannot be removed from a paid order.');
            }
            return transaction.orderItem.delete({ where: { id } });
        }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
    }
};
exports.OrderItemService = OrderItemService;
exports.OrderItemService = OrderItemService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(prisma_service_1.PrismaService)),
    __param(1, (0, common_1.Inject)(tenant_context_1.TenantContext)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tenant_context_1.TenantContext])
], OrderItemService);
//# sourceMappingURL=orderitem.service.js.map