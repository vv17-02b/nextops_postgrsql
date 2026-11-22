import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type OrderItem } from '@prisma/client';
import { MAX_MINOR_UNITS } from '../common/money';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateOrderItemDto } from './dto/create-orderitem.dto';
import { UpdateOrderItemDto } from './dto/update-orderitem.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { paginate, type PaginatedResponse } from '../common/pagination/paginate';

const CANCELED_STATUSES = new Set(['CANCELED', 'CANCELLED']);

@Injectable()
export class OrderItemService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TenantContext)
    private readonly tenantContext: TenantContext,
  ) { }

  private resolveCompanyId(companyId?: string): string {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (!activeCompanyId) {
      throw new ForbiddenException('A business workspace is required.');
    }
    if (!this.tenantContext.getCompanyId()) {
      this.tenantContext.setCompanyId(activeCompanyId);
    }
    return activeCompanyId;
  }

  private async deductStock(
    tx: Prisma.TransactionClient,
    companyId: string,
    productId: string,
    neededQty: number,
  ): Promise<void> {
    if (neededQty <= 0) return;

    const stocks = await tx.warehouse.findMany({
      where: { companyId, productId, quantity: { gt: 0 } },
      orderBy: { id: 'asc' },
      select: { id: true, quantity: true },
    });

    const totalAvailable = stocks.reduce((sum, row) => sum + row.quantity, 0);
    if (totalAvailable < neededQty) {
      throw new BadRequestException(
        `Недостатньо товару на складі (запитано: ${neededQty} шт., доступно: ${totalAvailable} шт.).`,
      );
    }

    let remaining = neededQty;
    for (const row of stocks) {
      if (remaining <= 0) break;
      const take = Math.min(row.quantity, remaining);

      const updated = await tx.warehouse.updateMany({
        where: { id: row.id, companyId, quantity: { gte: take } },
        data: { quantity: { decrement: take } },
      });

      if (updated.count === 0) {
        throw new BadRequestException('Залишки на складі змінилися. Спробуйте ще раз.');
      }
      remaining -= take;
    }
  }

  private async restoreStock(
    tx: Prisma.TransactionClient,
    companyId: string,
    productId: string,
    returnQty: number,
  ): Promise<void> {
    if (returnQty <= 0) return;

    const targetWarehouse = await tx.warehouse.findFirst({
      where: { companyId, productId },
      orderBy: { id: 'asc' },
      select: { id: true },
    });

    if (targetWarehouse) {
      await tx.warehouse.update({
        where: { id: targetWarehouse.id },
        data: { quantity: { increment: returnQty } },
      });
    } else {
      await tx.warehouse.create({
        data: {
          companyId,
          productId,
          location: 'Основний склад (повернення)',
          quantity: returnQty,
        },
      });
    }
  }

  async create(dto: CreateOrderItemDto, companyId?: string): Promise<OrderItem> {
    const activeCompanyId = this.resolveCompanyId(companyId);

    return this.tenantContext.runWithCompany(activeCompanyId, () =>
      this.prisma.$transaction(
        async (transaction) => {
          const [order, product] = await Promise.all([
            transaction.order.findFirst({
              where: { id: dto.orderId, paymentStatus: 'UNPAID', companyId: activeCompanyId },
              select: { id: true, status: true, totalAmountMinor: true },
            }),
            transaction.product.findFirst({
              where: { id: dto.productId, isActive: true, companyId: activeCompanyId },
              select: { id: true, priceMinor: true },
            }),
          ]);
          if (!order) {
            throw new NotFoundException('An unpaid order was not found in this workspace.');
          }
          if (!product) {
            throw new NotFoundException('An active product was not found in this workspace.');
          }

          const lineTotal = dto.quantity * product.priceMinor;
          if (!Number.isSafeInteger(lineTotal) || order.totalAmountMinor + lineTotal > MAX_MINOR_UNITS) {
            throw new BadRequestException('The order item amount exceeds the supported range.');
          }

          if (!CANCELED_STATUSES.has(order.status.toUpperCase())) {
            await this.deductStock(transaction, activeCompanyId, product.id, dto.quantity);
          }

          const updatedOrder = await transaction.order.updateMany({
            where: { id: order.id, paymentStatus: 'UNPAID', companyId: activeCompanyId },
            data: { totalAmountMinor: { increment: lineTotal } },
          });
          if (updatedOrder.count !== 1) {
            throw new BadRequestException('Items cannot be added to a paid order.');
          }

          return transaction.orderItem.create({
            data: {
              companyId: activeCompanyId,
              orderId: order.id,
              productId: product.id,
              quantity: dto.quantity,
              priceMinor: product.priceMinor,
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );
  }

  async findAll(
    query: PaginationQueryDto,
    companyId?: string,
  ): Promise<PaginatedResponse<OrderItem>> {
    const activeCompanyId = this.resolveCompanyId(companyId);
    const where = { companyId: activeCompanyId };

    return paginate(
      query,
      (skip, take) => this.prisma.orderItem.findMany({ where, skip, take }),
      () => this.prisma.orderItem.count({ where }),
    );
  }

  async findOne(id: string, companyId?: string): Promise<OrderItem> {
    const activeCompanyId = this.resolveCompanyId(companyId);
    const item = await this.prisma.orderItem.findFirst({
      where: { id, companyId: activeCompanyId },
    });
    if (!item) {
      throw new NotFoundException('Елемент замовлення не знайдено');
    }
    return item;
  }

  async update(id: string, dto: UpdateOrderItemDto, companyId?: string): Promise<OrderItem> {
    const activeCompanyId = this.resolveCompanyId(companyId);

    return this.tenantContext.runWithCompany(activeCompanyId, () =>
      this.prisma.$transaction(
        async (transaction) => {
          const item = await transaction.orderItem.findFirst({
            where: { id, companyId: activeCompanyId },
          });
          if (!item) {
            throw new NotFoundException('Елемент замовлення не знайдено');
          }

          const order = await transaction.order.findFirst({
            where: { id: item.orderId, paymentStatus: 'UNPAID', companyId: activeCompanyId },
            select: { id: true, status: true, totalAmountMinor: true },
          });
          if (!order) {
            throw new BadRequestException('Items cannot be changed on a paid order.');
          }

          const quantity = dto.quantity ?? item.quantity;
          const qtyDelta = quantity - item.quantity;
          const amountChange = qtyDelta * item.priceMinor;
          const newTotal = order.totalAmountMinor + amountChange;

          if (!Number.isSafeInteger(newTotal) || newTotal < 0 || newTotal > MAX_MINOR_UNITS) {
            throw new BadRequestException('The updated order amount exceeds the supported range.');
          }

          if (!CANCELED_STATUSES.has(order.status.toUpperCase())) {
            if (qtyDelta > 0) {
              await this.deductStock(transaction, item.companyId, item.productId, qtyDelta);
            } else if (qtyDelta < 0) {
              await this.restoreStock(
                transaction,
                item.companyId,
                item.productId,
                Math.abs(qtyDelta),
              );
            }
          }

          const updatedOrder = await transaction.order.updateMany({
            where: { id: order.id, paymentStatus: 'UNPAID', companyId: activeCompanyId },
            data: { totalAmountMinor: { increment: amountChange } },
          });
          if (updatedOrder.count !== 1) {
            throw new BadRequestException('Items cannot be changed on a paid order.');
          }

          return transaction.orderItem.update({
            where: { id },
            data: { quantity },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );
  }

  async remove(id: string, companyId?: string): Promise<OrderItem> {
    const activeCompanyId = this.resolveCompanyId(companyId);

    return this.tenantContext.runWithCompany(activeCompanyId, () =>
      this.prisma.$transaction(
        async (transaction) => {
          const item = await transaction.orderItem.findFirst({
            where: { id, companyId: activeCompanyId },
          });
          if (!item) {
            throw new NotFoundException('Елемент замовлення не знайдено');
          }

          const order = await transaction.order.findFirst({
            where: { id: item.orderId, paymentStatus: 'UNPAID', companyId: activeCompanyId },
            select: { id: true, status: true, totalAmountMinor: true },
          });
          if (!order) {
            throw new BadRequestException('Items cannot be removed from a paid order.');
          }
          const itemTotal = item.quantity * item.priceMinor;
          if (order.totalAmountMinor < itemTotal) {
            throw new BadRequestException('The order total is inconsistent with its items.');
          }

          if (!CANCELED_STATUSES.has(order.status.toUpperCase())) {
            await this.restoreStock(transaction, item.companyId, item.productId, item.quantity);
          }

          const updatedOrder = await transaction.order.updateMany({
            where: { id: order.id, paymentStatus: 'UNPAID', companyId: activeCompanyId },
            data: { totalAmountMinor: { decrement: itemTotal } },
          });
          if (updatedOrder.count !== 1) {
            throw new BadRequestException('Items cannot be removed from a paid order.');
          }

          return transaction.orderItem.delete({ where: { id } });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );
  }
}


