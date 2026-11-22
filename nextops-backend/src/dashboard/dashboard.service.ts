import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import {
  PlanEnforcementService,
  type WorkspaceBillingSnapshot,
} from '../billing/plan-enforcement.service';

export interface DailyRevenuePoint {
  date: string;
  label: string;
  revenueMinor: number;
  ordersCount: number;
}

export interface OrderStatusBreakdown {
  pending: number;
  confirmed: number;
  canceled: number;
  other: number;
}

export interface TopProductMetric {
  productId: string;
  name: string;
  sku: string | null;
  unitsSold: number;
  revenueMinor: number;
  currentStock: number;
}

export interface LowStockProductAlert {
  productId: string;
  name: string;
  sku: string | null;
  stock: number;
}

export interface DashboardOverviewResponse {
  kpis: {
    totalRevenueMinor: number;
    currency: string;
    totalOrders: number;
    confirmedOrders: number;
    conversionRatePercent: number;
    averageOrderValueMinor: number;
    aiRemainingMinor: number;
    aiLimitMinor: number;
  };
  dailyRevenue: DailyRevenuePoint[];
  statusBreakdown: OrderStatusBreakdown;
  topProducts: TopProductMetric[];
  lowStockAlerts: LowStockProductAlert[];
  billing: WorkspaceBillingSnapshot;
}

@Injectable()
export class DashboardService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TenantContext)
    private readonly tenantContext: TenantContext,
    @Inject(PlanEnforcementService)
    private readonly planEnforcement: PlanEnforcementService,
  ) {}

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

  async getOverview(companyId?: string): Promise<DashboardOverviewResponse> {
    const activeCompanyId = this.resolveCompanyId(companyId);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCHours(0, 0, 0, 0);
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);

    const [
      ordersByStatus,
      recentOrders,
      latestOrderCurrency,
      orderItems,
      products,
      aiBudgets,
      billing,
    ] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['status'],
        where: { companyId: activeCompanyId },
        _count: { _all: true },
        _sum: { totalAmountMinor: true },
      }),
      this.prisma.order.findMany({
        where: {
          companyId: activeCompanyId,
          createdAt: { gte: sevenDaysAgo },
          status: { notIn: ['CANCELED', 'CANCELLED', 'canceled', 'cancelled'] },
        },
        select: {
          totalAmountMinor: true,
          createdAt: true,
        },
      }),
      this.prisma.order.findFirst({
        where: { companyId: activeCompanyId },
        orderBy: { createdAt: 'desc' },
        select: { currency: true },
      }),
      this.prisma.orderItem.findMany({
        where: {
          companyId: activeCompanyId,
          order: {
            status: { notIn: ['CANCELED', 'CANCELLED', 'canceled', 'cancelled'] },
          },
        },
        select: {
          productId: true,
          quantity: true,
          priceMinor: true,
        },
      }),
      this.prisma.product.findMany({
        where: { companyId: activeCompanyId },
        select: {
          id: true,
          name: true,
          slug: true,
          inventory: {
            select: { quantity: true },
          },
        },
      }),
      this.prisma.userAiBudget.findMany({
        where: { companyId: activeCompanyId },
        select: {
          monthlyLimitMinor: true,
          currentUsageMinor: true,
        },
      }),
      this.planEnforcement.getBillingSnapshot(activeCompanyId),
    ]);

    const statusBreakdown: OrderStatusBreakdown = {
      pending: 0,
      confirmed: 0,
      canceled: 0,
      other: 0,
    };

    let totalRevenueMinor = 0;
    let totalOrders = 0;
    const primaryCurrency = latestOrderCurrency?.currency || billing.currency || 'USD';

    for (const group of ordersByStatus) {
      const count = group._count._all;
      const sumMinor = group._sum.totalAmountMinor ?? 0;
      totalOrders += count;

      const normalizedStatus = group.status.toUpperCase();
      if (normalizedStatus === 'PENDING') {
        statusBreakdown.pending += count;
        totalRevenueMinor += sumMinor;
      } else if (
        normalizedStatus === 'CONFIRMED' ||
        normalizedStatus === 'PAID' ||
        normalizedStatus === 'COMPLETED'
      ) {
        statusBreakdown.confirmed += count;
        totalRevenueMinor += sumMinor;
      } else if (normalizedStatus === 'CANCELED' || normalizedStatus === 'CANCELLED') {
        statusBreakdown.canceled += count;
      } else {
        statusBreakdown.other += count;
        totalRevenueMinor += sumMinor;
      }
    }

    const activeOrdersCount = totalOrders - statusBreakdown.canceled;
    const conversionRatePercent =
      totalOrders > 0 ? Math.round((statusBreakdown.confirmed / totalOrders) * 100) : 0;
    const averageOrderValueMinor =
      activeOrdersCount > 0 ? Math.round(totalRevenueMinor / activeOrdersCount) : 0;

    const dailyMap = new Map<string, DailyRevenuePoint>();
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCDate(d.getUTCDate() - i);
      const isoKey = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        timeZone: 'UTC',
      });
      dailyMap.set(isoKey, {
        date: isoKey,
        label,
        revenueMinor: 0,
        ordersCount: 0,
      });
    }

    for (const order of recentOrders) {
      const isoKey = order.createdAt.toISOString().slice(0, 10);
      const bucket = dailyMap.get(isoKey);
      if (bucket) {
        bucket.revenueMinor += order.totalAmountMinor;
        bucket.ordersCount += 1;
      }
    }

    const dailyRevenue = Array.from(dailyMap.values());

    const normalizedProducts = products.map((p) => {
      const totalStock = p.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        stock: totalStock,
      };
    });

    const productById = new Map(normalizedProducts.map((p) => [p.id, p]));
    const salesByProduct = new Map<string, { unitsSold: number; revenueMinor: number }>();

    for (const item of orderItems) {
      const current = salesByProduct.get(item.productId) ?? { unitsSold: 0, revenueMinor: 0 };
      current.unitsSold += item.quantity;
      current.revenueMinor += item.quantity * item.priceMinor;
      salesByProduct.set(item.productId, current);
    }

    const topProducts: TopProductMetric[] = Array.from(salesByProduct.entries())
      .map(([productId, stats]) => {
        const prod = productById.get(productId);
        return {
          productId,
          name: prod?.name ?? 'Товар каталогу',
          sku: prod?.slug ?? null,
          unitsSold: stats.unitsSold,
          revenueMinor: stats.revenueMinor,
          currentStock: prod?.stock ?? 0,
        };
      })
      .sort((a, b) => b.revenueMinor - a.revenueMinor)
      .slice(0, 5);

    const lowStockAlerts: LowStockProductAlert[] = normalizedProducts
      .filter((p) => p.stock <= 10)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5)
      .map((p) => ({
        productId: p.id,
        name: p.name,
        sku: p.slug ?? null,
        stock: p.stock,
      }));

    let aiLimitMinor = 0;
    let aiUsedMinor = 0;
    for (const budget of aiBudgets) {
      aiLimitMinor += budget.monthlyLimitMinor;
      aiUsedMinor += budget.currentUsageMinor;
    }
    const aiRemainingMinor = Math.max(0, aiLimitMinor - aiUsedMinor);

    return {
      kpis: {
        totalRevenueMinor,
        currency: primaryCurrency,
        totalOrders,
        confirmedOrders: statusBreakdown.confirmed,
        conversionRatePercent,
        averageOrderValueMinor,
        aiRemainingMinor,
        aiLimitMinor,
      },
      dailyRevenue,
      statusBreakdown,
      topProducts,
      lowStockAlerts,
      billing,
    };
  }
}
