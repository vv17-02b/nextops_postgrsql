import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { PlanEnforcementService, type WorkspaceBillingSnapshot } from '../billing/plan-enforcement.service';

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
  ) { }

  async getOverview(companyId?: string): Promise<DashboardOverviewResponse> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (!activeCompanyId) {
      throw new ForbiddenException('A business workspace is required.');
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setHours(0, 0, 0, 0);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const [orders, orderItems, products, aiBudgets, billing] = await Promise.all([
      this.prisma.order.findMany({
        where: { companyId: activeCompanyId },
        select: {
          id: true,
          status: true,
          totalAmountMinor: true,
          currency: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      }),
      this.prisma.orderItem.findMany({
        where: { companyId: activeCompanyId },
        select: {
          productId: true,
          quantity: true,
          priceMinor: true,
        },
        take: 3000,
      }),
      this.prisma.product.findMany({
        where: { companyId: activeCompanyId },
        select: {
          id: true,
          name: true,
          slug: true,
          inventory: true,
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
    let primaryCurrency = billing.currency || 'USD';

    for (const order of orders) {
      if (order.currency) {
        primaryCurrency = order.currency;
      }
      const normalizedStatus = order.status.toUpperCase();
      if (normalizedStatus === 'PENDING') {
        statusBreakdown.pending += 1;
        totalRevenueMinor += order.totalAmountMinor;
      } else if (
        normalizedStatus === 'CONFIRMED' ||
        normalizedStatus === 'PAID' ||
        normalizedStatus === 'COMPLETED'
      ) {
        statusBreakdown.confirmed += 1;
        totalRevenueMinor += order.totalAmountMinor;
      } else if (normalizedStatus === 'CANCELED' || normalizedStatus === 'CANCELLED') {
        statusBreakdown.canceled += 1;
      } else {
        statusBreakdown.other += 1;
        totalRevenueMinor += order.totalAmountMinor;
      }
    }

    const activeOrdersCount = orders.length - statusBreakdown.canceled;
    const conversionRatePercent =
      orders.length > 0 ? Math.round((statusBreakdown.confirmed / orders.length) * 100) : 0;
    const averageOrderValueMinor =
      activeOrdersCount > 0 ? Math.round(totalRevenueMinor / activeOrdersCount) : 0;

    // Динаміка виручки за останні 7 днів
    const dailyMap = new Map<string, DailyRevenuePoint>();
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const isoKey = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' });
      dailyMap.set(isoKey, {
        date: isoKey,
        label,
        revenueMinor: 0,
        ordersCount: 0,
      });
    }

    for (const order of orders) {
      if (order.createdAt < sevenDaysAgo) continue;
      if (order.status.toUpperCase() === 'CANCELED') continue;
      const isoKey = order.createdAt.toISOString().slice(0, 10);
      const bucket = dailyMap.get(isoKey);
      if (bucket) {
        bucket.revenueMinor += order.totalAmountMinor;
        bucket.ordersCount += 1;
      }
    }

    const dailyRevenue = Array.from(dailyMap.values());

    // Підрахунок залишків на складі для кожного товару через inventory
    const normalizedProducts = products.map((p) => {
      const invList = Array.isArray(p.inventory) ? p.inventory : [];
      const totalStock = invList.reduce((sum, inv) => {
        const rec = inv as Record<string, unknown>;
        const qty =
          typeof rec.quantity === 'number'
            ? rec.quantity
            : typeof rec.stock === 'number'
              ? rec.stock
              : typeof rec.availableQuantity === 'number'
                ? rec.availableQuantity
                : 0;
        return sum + qty;
      }, 0);
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
      const record = budget as Record<string, unknown>;
      const limitVal =
        typeof record.monthlyLimitMinor === 'number'
          ? record.monthlyLimitMinor
          : typeof record.limitMinor === 'number'
            ? record.limitMinor
            : typeof record.budgetMinor === 'number'
              ? record.budgetMinor
              : 1000;
      const usedVal =
        typeof record.usedMinor === 'number'
          ? record.usedMinor
          : typeof record.spentMinor === 'number'
            ? record.spentMinor
            : 0;
      aiLimitMinor += limitVal;
      aiUsedMinor += usedVal;
    }
    const aiRemainingMinor = Math.max(0, aiLimitMinor - aiUsedMinor);

    return {
      kpis: {
        totalRevenueMinor,
        currency: primaryCurrency,
        totalOrders: orders.length,
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
