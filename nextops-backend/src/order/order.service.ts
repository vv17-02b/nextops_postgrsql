import { BadRequestException, ForbiddenException, Injectable, NotFoundException, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { AuditService } from '../audit/audit.service';
import { WebhookQueueService } from '../common/queue/webhook-queue.service';
import { TelegramNotifierService } from '../common/queue/telegram-notifier.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { paginate, type PaginatedResponse } from '../common/pagination/paginate';
import { Prisma } from '@prisma/client';
import type { Order } from '@prisma/client';
import { MAX_MINOR_UNITS } from '../common/money';
import { createClient } from 'redis';

const ADMIN_ROLES = new Set(['OWNER', 'ADMIN']);

@Injectable()
export class OrderService implements OnModuleInit, OnModuleDestroy {
  private readonly redis = process.env.REDIS_URL
    ? createClient({ url: process.env.REDIS_URL })
    : null;

  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TenantContext)
    private readonly tenantContext: TenantContext,
    @Inject(AuditService)
    private readonly audit: AuditService,
    @Inject(WebhookQueueService)
    private readonly webhookQueue: WebhookQueueService,
    @Inject(TelegramNotifierService)
    private readonly telegramNotifier: TelegramNotifierService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.redis && !this.redis.isOpen) {
      await this.redis.connect().catch(() => undefined);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis?.isOpen) {
      await this.redis.quit().catch(() => undefined);
    }
  }

  private getCountCacheKey(companyId?: string | null): string {
    return `nextops:orders:count:${companyId ?? 'global'}`;
  }

  private async invalidateCountCache(companyId?: string | null): Promise<void> {
    if (!this.redis?.isReady) return;
    await this.redis.del(this.getCountCacheKey(companyId)).catch(() => undefined);
  }

  async create(dto: CreateOrderDto, userId: string, companyId?: string): Promise<Order> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (!activeCompanyId) throw new ForbiddenException('A business workspace is required.');

    const createdOrder = await this.prisma.$transaction(async (transaction) => {
      const requestedProductIds = [...new Set(dto.items.map((item) => item.productId))];
      const products = await transaction.product.findMany({
        where: { id: { in: requestedProductIds }, isActive: true, companyId: activeCompanyId },
        select: { id: true, priceMinor: true },
      });
      if (products.length !== requestedProductIds.length) {
        throw new NotFoundException('One or more products are unavailable in this workspace.');
      }

      const productPrices = new Map(products.map((product) => [product.id, product.priceMinor]));
      const items = dto.items.map((item) => {
        const priceMinor = productPrices.get(item.productId);
        if (priceMinor === undefined) {
          throw new NotFoundException('One or more products are unavailable in this workspace.');
        }
        return {
          productId: item.productId,
          quantity: item.quantity,
          priceMinor,
        };
      });
      const totalAmountMinor = items.reduce((total, item) => total + item.quantity * item.priceMinor, 0);
      if (!Number.isSafeInteger(totalAmountMinor) || totalAmountMinor > MAX_MINOR_UNITS) {
        throw new BadRequestException('The calculated order amount exceeds the supported range.');
      }

      return transaction.order.create({
        data: {
          companyId: activeCompanyId,
          userId,
          totalAmountMinor,
          currency: dto.currency || 'UAH',
          shippingAddress: dto.shippingAddress
            ? (dto.shippingAddress as unknown as Prisma.InputJsonValue)
            : {},
          status: 'PENDING',
          paymentStatus: 'UNPAID',
          paymentMethod: 'CARD',
          items: items.length ? { create: items } : undefined,
        },
        include: { items: true },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    await this.invalidateCountCache(activeCompanyId);

    await this.webhookQueue.dispatchCompanyEvent(activeCompanyId, 'ORDER_CREATED', {
      orderId: createdOrder.id,
      totalAmountMinor: createdOrder.totalAmountMinor,
      currency: createdOrder.currency,
      status: createdOrder.status,
    });

    void this.telegramNotifier.notifyNewOrder(activeCompanyId, {
      orderId: createdOrder.id,
      totalAmountMinor: createdOrder.totalAmountMinor,
      currency: createdOrder.currency,
      itemsCount: createdOrder.items.length,
      status: createdOrder.status,
    });

    return createdOrder;
  }

  async findAll(query: PaginationQueryDto, companyId?: string): Promise<PaginatedResponse<Order>> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    const where = activeCompanyId ? { companyId: activeCompanyId } : {};

    return paginate(
      query,
      (skip, take) =>
        this.prisma.order.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: { items: true },
        }),
      async () => {
        const cacheKey = this.getCountCacheKey(activeCompanyId);
        if (this.redis?.isReady) {
          const cached = await this.redis.get(cacheKey).catch(() => null);
          if (cached !== null) return Number(cached);
        }
        const total = await this.prisma.order.count({ where });
        if (this.redis?.isReady) {
          await this.redis.set(cacheKey, String(total), { EX: 60 }).catch(() => undefined);
        }
        return total;
      },
    );
  }

  async findOne(id: string, companyId?: string): Promise<Order> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    const item = await this.prisma.order.findFirst({
      where: activeCompanyId ? { id, companyId: activeCompanyId } : { id },
      include: { items: true },
    });
    if (!item) throw new NotFoundException(`Документ не знайдено`);
    return item;
  }

  async update(id: string, dto: UpdateOrderDto, companyId?: string, userRole?: string): Promise<Order> {
    const existing = await this.findOne(id, companyId);

    const updateData: Prisma.OrderUpdateInput = {};

    if (dto.status) {
      if (!userRole || !ADMIN_ROLES.has(userRole)) {
        throw new ForbiddenException('Only a workspace owner or administrator can change the order status.');
      }
      updateData.status = dto.status;
    }

    if (dto.shippingAddress) {
      updateData.shippingAddress = dto.shippingAddress as unknown as Prisma.InputJsonValue;
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: updateData,
      include: { items: true },
    });

    if (dto.status && dto.status !== existing.status) {
      await this.audit.record({
        companyId: existing.companyId,
        action: 'ORDER_STATUS_UPDATED',
        entityType: 'Order',
        entityId: id,
        metadata: {
          previousStatus: existing.status,
          newStatus: dto.status,
          actorRole: userRole ?? 'UNKNOWN',
        },
      });

      await this.webhookQueue.dispatchCompanyEvent(existing.companyId, 'ORDER_STATUS_UPDATED', {
        orderId: id,
        previousStatus: existing.status,
        newStatus: dto.status,
      });
    }

    return updated;
  }

  async remove(id: string, companyId?: string): Promise<Order> {
    const existing = await this.findOne(id, companyId);
    const deleted = await this.prisma.order.delete({ where: { id } });
    await this.invalidateCountCache(existing.companyId);
    return deleted;
  }
}
