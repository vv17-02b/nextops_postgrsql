import { BadRequestException, ForbiddenException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { paginate, type PaginatedResponse } from '../common/pagination/paginate';
import { Prisma } from '@prisma/client';
import type { Order } from '@prisma/client';
import { MAX_MINOR_UNITS } from '../common/money';

@Injectable()
export class OrderService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TenantContext) private readonly tenantContext: TenantContext,
  ) {}

  async create(dto: CreateOrderDto, userId: string, companyId?: string): Promise<Order> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (!activeCompanyId) throw new ForbiddenException('A business workspace is required.');
    return this.prisma.$transaction(async (transaction) => {
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
          include: { items: true },
        }),
      () => this.prisma.order.count({ where }),
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

  async update(id: string, dto: UpdateOrderDto, companyId?: string): Promise<Order> {
    await this.findOne(id, companyId);

    const updateData: Prisma.OrderUpdateInput = {};

    if (dto.status) updateData.status = dto.status;
    if (dto.shippingAddress) {
      updateData.shippingAddress = dto.shippingAddress as unknown as Prisma.InputJsonValue;
    }

    return this.prisma.order.update({
      where: { id },
      data: updateData,
      include: { items: true },
    });
  }

  async remove(id: string, companyId?: string): Promise<Order> {
    await this.findOne(id, companyId);
    return this.prisma.order.delete({ where: { id } });
  }
}
