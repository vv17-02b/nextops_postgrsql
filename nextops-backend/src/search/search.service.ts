import { ForbiddenException, Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createClient } from 'redis';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';

export interface GlobalSearchHit {
  id: string;
  category: 'PRODUCT' | 'ORDER' | 'USER' | 'KNOWLEDGE';
  title: string;
  subtitle: string;
  href: string;
  badge?: string;
}

export interface GlobalSearchResponse {
  query: string;
  aiEnabled: boolean;
  hits: GlobalSearchHit[];
  cached: boolean;
}

@Injectable()
export class SearchService implements OnModuleInit, OnModuleDestroy {
  private readonly redis = process.env.REDIS_URL
    ? createClient({ url: process.env.REDIS_URL })
    : null;

  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TenantContext)
    private readonly tenantContext: TenantContext,
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

  async searchWorkspace(rawQuery: string, companyId?: string): Promise<GlobalSearchResponse> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (!activeCompanyId) {
      throw new ForbiddenException('A business workspace is required.');
    }

    const aiEnabled = process.env.AI_ENABLED === 'true';
    const query = rawQuery.trim();
    if (query.length < 2) {
      return { query, aiEnabled, hits: [], cached: false };
    }

    const cacheKey = `nextops:search:${activeCompanyId}:${query.toLowerCase()}`;
    if (this.redis?.isReady) {
      const cached = await this.redis.get(cacheKey).catch(() => null);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as GlobalSearchHit[];
          return { query, aiEnabled, hits: parsed, cached: true };
        } catch {
          // Fallback to DB query if cached payload is invalid
        }
      }
    }
        const [products, orders, users, docs] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          companyId: activeCompanyId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { slug: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, priceMinor: true, isActive: true },
        take: 4,
      }),
      this.prisma.order.findMany({
        where: {
          companyId: activeCompanyId,
          OR: [
            { id: { contains: query, mode: 'insensitive' } },
            { status: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: { id: true, status: true, totalAmountMinor: true, currency: true },
        take: 4,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.findMany({
        where: {
          companyId: activeCompanyId,
          email: { contains: query, mode: 'insensitive' },
        },
        select: { id: true, email: true, role: true },
        take: 4,
      }),
      this.prisma.agentKnowledgeBase.findMany({
        where: {
          companyId: activeCompanyId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: { id: true, title: true, content: true },
        take: 3,
      }),
    ]);

    const hits: GlobalSearchHit[] = [
      ...products.map((p) => ({
        id: p.id,
        category: 'PRODUCT' as const,
        title: p.name,
        subtitle: `$${(p.priceMinor / 100).toFixed(2)}`,
        href: '/product',
        badge: p.isActive ? 'Товар' : 'Архів',
      })),
      ...orders.map((o) => ({
        id: o.id,
        category: 'ORDER' as const,
        title: `Замовлення #${o.id.slice(0, 8)}`,
        subtitle: `${(o.totalAmountMinor / 100).toFixed(2)} ${o.currency}`,
        href: '/order',
        badge: o.status,
      })),
         ...users.map((u) => ({
        id: u.id,
        category: 'USER' as const,
        title: u.email ?? `Користувач #${u.id.slice(0, 8)}`,
        subtitle: `Роль: ${u.role}`,
        href: '/user',
        badge: u.role,
      })),

      ...docs.map((d) => ({
        id: d.id,
        category: 'KNOWLEDGE' as const,
        title: d.title,
        subtitle: d.content.slice(0, 60),
        href: '/agentknowledgebase',
        badge: 'База знань',
      })),
    ];

    if (this.redis?.isReady) {
      await this.redis.set(cacheKey, JSON.stringify(hits), { EX: 15 }).catch(() => undefined);
    }

    return { query, aiEnabled, hits, cached: false };
  }
}

