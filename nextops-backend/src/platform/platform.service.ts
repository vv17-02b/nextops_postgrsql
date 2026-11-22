import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import Redis from 'ioredis';
import { rm } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { TokenRevocationService } from '../auth/token-revocation.service';
import { TelegramNotifierService } from '../common/queue/telegram-notifier.service';

export type PlatformCompanyFilter = 'ALL' | 'PAID' | 'EMPTY' | 'BLOCKED';

export interface PlatformOverviewQuery {
  page?: number;
  limit?: number;
  search?: string;
  filter?: PlatformCompanyFilter;
}

export interface PlatformCompanyItem {
  id: string;
  name: string;
  planCode: string;
  subscriptionStatus: string;
  currentPeriodEnd: string | null;
  createdAt: string;
  ownerEmail: string | null;
  ownerName: string | null;
  usersCount: number;
  ordersCount: number;
  productsCount: number;
  isProtectedPlatformCompany: boolean;
}

export interface PlatformOverviewResponse {
  summary: {
    totalCompanies: number;
    paidCompanies: number;
    freeCompanies: number;
    emptyCompanies: number;
    suspendedOrPastDueCompanies: number;
    totalUsers: number;
    totalOrders: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  companies: PlatformCompanyItem[];
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const THIRTY_DAYS_MS = 30 * DAY_MS;
const FOURTEEN_DAYS_MS = 14 * DAY_MS;
const HEARTBEAT_CHECK_MS = 15 * 60 * 1000;
const REDIS_LAST_RUN_KEY = 'platform:lifecycle:last_run_at';
const REDIS_LOCK_KEY = 'platform:lifecycle:running_lock';

@Injectable()
export class PlatformService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PlatformService.name);
  private cleanupTimer: NodeJS.Timeout | null = null;
  private bootTimer: NodeJS.Timeout | null = null;
  private redisClient: Redis | null = null;

  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TenantContext)
    private readonly tenantContext: TenantContext,
    @Inject(TokenRevocationService)
    private readonly tokenRevocation: TokenRevocationService,
    @Inject(TelegramNotifierService)
    private readonly telegramNotifier: TelegramNotifierService,
  ) {
    const redisUrl = process.env.REDIS_URL?.trim();
    if (redisUrl) {
      this.redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 2,
        enableReadyCheck: false,
      });
      this.redisClient.on('error', (err: Error) => {
        this.logger.warn(`Redis lifecycle state warning: ${err.message}`);
      });
    }
  }

  onModuleInit(): void {
    this.bootTimer = setTimeout(() => {
      void this.checkAndRunHourlyMaintenance('startup').catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Startup lifecycle recovery failed: ${msg}`);
      });
    }, 15_000);
    this.bootTimer.unref();

    this.cleanupTimer = setInterval(() => {
      void this.checkAndRunHourlyMaintenance('scheduled').catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Scheduled lifecycle check failed: ${msg}`);
      });
    }, HEARTBEAT_CHECK_MS);
    this.cleanupTimer.unref();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.bootTimer) {
      clearTimeout(this.bootTimer);
      this.bootTimer = null;
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    if (this.redisClient) {
      await this.redisClient.quit().catch(() => undefined);
      this.redisClient = null;
    }
  }

  private async checkAndRunHourlyMaintenance(trigger: 'startup' | 'scheduled'): Promise<void> {
    const nowMs = Date.now();
    let downtimeHours = 0;

    if (this.redisClient) {
      const lastRunRaw = await this.redisClient.get(REDIS_LAST_RUN_KEY).catch(() => null);
      const lastRunMs = lastRunRaw ? Number(lastRunRaw) : 0;

      if (Number.isFinite(lastRunMs) && lastRunMs > 0 && nowMs - lastRunMs < HOUR_MS) {
        return;
      }

      if (Number.isFinite(lastRunMs) && lastRunMs > 0) {
        downtimeHours = Math.floor((nowMs - lastRunMs) / HOUR_MS);
      }

      const lockAcquired = await this.redisClient
        .set(REDIS_LOCK_KEY, String(nowMs), 'PX', 5 * 60 * 1000, 'NX')
        .catch(() => 'OK');
      if (!lockAcquired) {
        return;
      }
    }

    try {
      const result = await this.runAutomatedLifecycleMaintenance();

      if (this.redisClient) {
        await this.redisClient.set(REDIS_LAST_RUN_KEY, String(Date.now())).catch(() => undefined);
      }

      if (
        trigger === 'startup' &&
        downtimeHours >= 2 &&
        result.pastDueMarked > 0 &&
        result.expiredDeletedCount === 0 &&
        result.abandonedFreeDeletedCount === 0
      ) {
        const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
        const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
        if (botToken && chatId) {
          await this.telegramNotifier
            .sendMessage(
              botToken,
              chatId,
              `⚡ <b>Сервер відновлено після простою (~${downtimeHours} год.):</b> перераховано підписки, заблоковано за прострочення: <b>${result.pastDueMarked}</b> комп.`,
            )
            .catch(() => undefined);
        }
      }
    } finally {
      if (this.redisClient) {
        await this.redisClient.del(REDIS_LOCK_KEY).catch(() => undefined);
      }
    }
  }

  private buildEmptyCandidateWhere(
    bootstrapEmail: string,
    olderThanDate?: Date,
  ): Prisma.CompanyWhereInput {
    return {
      planCode: 'FREE',
      orders: { none: {} },
      products: { none: {} },
      ...(olderThanDate ? { createdAt: { lt: olderThanDate } } : {}),
      ...(bootstrapEmail
        ? {
          users: {
            none: {
              email: { equals: bootstrapEmail, mode: 'insensitive' },
            },
          },
        }
        : {}),
    };
  }

  async getPlatformOverview(query: PlatformOverviewQuery = {}): Promise<PlatformOverviewResponse> {
    const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase() ?? '';
    const page = Math.max(1, Math.floor(query.page ?? 1));
    const limit = Math.min(100, Math.max(5, Math.floor(query.limit ?? 15)));
    const skip = (page - 1) * limit;
    const search = query.search?.trim() ?? '';
    const filter: PlatformCompanyFilter = query.filter ?? 'ALL';

    return this.tenantContext.runWithoutTenant(() =>
      this.prisma.$transaction(async (tx) => {
        const whereClauses: Prisma.CompanyWhereInput[] = [];

        if (search.length > 0) {
          whereClauses.push({
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              {
                users: {
                  some: {
                    email: { contains: search, mode: 'insensitive' },
                  },
                },
              },
            ],
          });
        }

        if (filter === 'PAID') {
          whereClauses.push({
            planCode: { not: 'FREE' },
            subscriptionStatus: { in: ['ACTIVE', 'TRIALING'] },
          });
        } else if (filter === 'EMPTY') {
          whereClauses.push(this.buildEmptyCandidateWhere(bootstrapEmail));
        } else if (filter === 'BLOCKED') {
          whereClauses.push({
            subscriptionStatus: { in: ['SUSPENDED', 'PAST_DUE', 'CANCELED'] },
          });
        }

        const where: Prisma.CompanyWhereInput =
          whereClauses.length > 0 ? { AND: whereClauses } : {};

        const [
          filteredTotal,
          companies,
          totalCompanies,
          paidCompanies,
          freeCompanies,
          emptyCompanies,
          suspendedOrPastDueCompanies,
          totalUsers,
          totalOrders,
        ] = await Promise.all([
          tx.company.count({ where }),
          tx.company.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: {
              users: {
                where: { role: 'OWNER' },
                select: { email: true, name: true },
                take: 1,
              },
              _count: {
                select: {
                  users: true,
                  orders: true,
                  products: true,
                },
              },
            },
          }),
          tx.company.count(),
          tx.company.count({
            where: {
              planCode: { not: 'FREE' },
              subscriptionStatus: { in: ['ACTIVE', 'TRIALING'] },
            },
          }),
          tx.company.count({ where: { planCode: 'FREE' } }),
          tx.company.count({ where: this.buildEmptyCandidateWhere(bootstrapEmail) }),
          tx.company.count({
            where: { subscriptionStatus: { in: ['SUSPENDED', 'PAST_DUE', 'CANCELED'] } },
          }),
          tx.user.count(),
          tx.order.count(),
        ]);

        const items: PlatformCompanyItem[] = companies.map((company) => {
          const owner = company.users.at(0);
          const ownerEmail = owner?.email ?? null;
          const isProtected =
            Boolean(bootstrapEmail) && ownerEmail?.trim().toLowerCase() === bootstrapEmail;

          return {
            id: company.id,
            name: company.name,
            planCode: company.planCode,
            subscriptionStatus: company.subscriptionStatus,
            currentPeriodEnd: company.currentPeriodEnd
              ? company.currentPeriodEnd.toISOString()
              : null,
            createdAt: company.createdAt.toISOString(),
            ownerEmail,
            ownerName: owner?.name ?? null,
            usersCount: company._count.users,
            ordersCount: company._count.orders,
            productsCount: company._count.products,
            isProtectedPlatformCompany: isProtected,
          };
        });

        const totalPages = Math.max(1, Math.ceil(filteredTotal / limit));

        return {
          summary: {
            totalCompanies,
            paidCompanies,
            freeCompanies,
            emptyCompanies,
            suspendedOrPastDueCompanies,
            totalUsers,
            totalOrders,
          },
          pagination: {
            page: Math.min(page, totalPages),
            limit,
            total: filteredTotal,
            totalPages,
          },
          companies: items,
        };
      }),
    );
  }

  async suspendCompany(companyId: string): Promise<{ suspended: true; id: string; name: string }> {
    const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();

    return this.tenantContext.runWithoutTenant(() =>
      this.prisma.$transaction(async (tx) => {
        const company = await tx.company.findUnique({
          where: { id: companyId },
          include: { users: { select: { id: true, email: true } } },
        });

        if (!company) {
          throw new NotFoundException('Компанію не знайдено.');
        }

        if (
          bootstrapEmail &&
          company.users.some((u) => u.email?.trim().toLowerCase() === bootstrapEmail)
        ) {
          throw new BadRequestException('Неможливо заблокувати головну компанію власника платформи.');
        }

        await tx.company.update({
          where: { id: companyId },
          data: { subscriptionStatus: 'SUSPENDED' },
        });

        await Promise.all(
          company.users.map((u) =>
            this.tokenRevocation.bumpSessionEpoch(u.id).catch(() => undefined),
          ),
        );

        return { suspended: true, id: company.id, name: company.name };
      }),
    );
  }

  async activateCompany(
    companyId: string,
    planCode?: string,
    days = 30,
  ): Promise<{
    activated: true;
    id: string;
    name: string;
    planCode: string;
    currentPeriodEnd: string | null;
  }> {
    return this.tenantContext.runWithoutTenant(() =>
      this.prisma.$transaction(async (tx) => {
        const company = await tx.company.findUnique({
          where: { id: companyId },
          select: { id: true, name: true, planCode: true, currentPeriodEnd: true },
        });

        if (!company) {
          throw new NotFoundException('Компанію не знайдено.');
        }

        const targetPlanCode = planCode?.trim().toUpperCase() || company.planCode || 'FREE';
        const plan = await tx.plan.findUnique({
          where: { code: targetPlanCode },
          select: { code: true, priceMinor: true },
        });

        if (!plan) {
          throw new NotFoundException(`Тариф "${targetPlanCode}" не знайдено.`);
        }

        const safeDays = Number.isFinite(days) && days > 0 ? Math.min(3650, Math.floor(days)) : 30;
        const nowMs = Date.now();
        const baseStartMs =
          company.currentPeriodEnd && company.currentPeriodEnd.getTime() > nowMs
            ? company.currentPeriodEnd.getTime()
            : nowMs;
        const nextPeriodEnd =
          plan.priceMinor === 0 && !planCode ? null : new Date(baseStartMs + safeDays * DAY_MS);

        const updated = await tx.company.update({
          where: { id: companyId },
          data: {
            planCode: plan.code,
            subscriptionStatus: 'ACTIVE',
            currentPeriodEnd: nextPeriodEnd,
          },
          select: { id: true, name: true, planCode: true, currentPeriodEnd: true },
        });

        return {
          activated: true,
          id: updated.id,
          name: updated.name,
          planCode: updated.planCode,
          currentPeriodEnd: updated.currentPeriodEnd ? updated.currentPeriodEnd.toISOString() : null,
        };
      }),
    );
  }


  async deleteCompanyPermanently(
    companyId: string,
  ): Promise<{ deleted: true; id: string; name: string }> {
    const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();

    return this.tenantContext.runWithoutTenant(async () => {
      const deletedCompany = await this.prisma.$transaction(async (tx) => {
        const company = await tx.company.findUnique({
          where: { id: companyId },
          include: {
            users: { select: { id: true, email: true } },
          },
        });

        if (!company) {
          throw new NotFoundException('Компанію не знайдено.');
        }

        if (
          bootstrapEmail &&
          company.users.some((u) => u.email?.trim().toLowerCase() === bootstrapEmail)
        ) {
          throw new BadRequestException(
            'Неможливо видалити головну компанію власника SaaS-платформи.',
          );
        }

        await Promise.all(
          company.users.map((u) =>
            this.tokenRevocation.bumpSessionEpoch(u.id).catch(() => undefined),
          ),
        );

        await tx.orderItem.deleteMany({ where: { companyId } });
        await tx.order.deleteMany({ where: { companyId } });
        await tx.product.deleteMany({ where: { companyId } });
        await tx.auditLog.deleteMany({ where: { companyId } });
        await tx.company.delete({ where: { id: companyId } });

        return { id: company.id, name: company.name };
      });

      const uploadsRoot = resolve(join(process.cwd(), 'uploads'));
      const companyUploadsDir = resolve(join(uploadsRoot, companyId));
      if (companyUploadsDir.startsWith(uploadsRoot + sep)) {
        await rm(companyUploadsDir, { recursive: true, force: true }).catch(() => undefined);
      }

      return { deleted: true, id: deletedCompany.id, name: deletedCompany.name };
    });
  }

  async cleanupEmptyCompanies(olderThanDays = 7): Promise<{ deletedCount: number }> {
    const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase() ?? '';
    const safeDays = Math.max(0, Math.floor(olderThanDays));
    const cutoffDate = new Date(Date.now() - safeDays * DAY_MS);

    const candidates = await this.tenantContext.runWithoutTenant(() =>
      this.prisma.$transaction((tx) =>
        tx.company.findMany({
          where: this.buildEmptyCandidateWhere(bootstrapEmail, cutoffDate),
          select: { id: true },
          take: 500,
        }),
      ),
    );

    let deletedCount = 0;
    for (const candidate of candidates) {
      await this.deleteCompanyPermanently(candidate.id);
      deletedCount += 1;
    }

    return { deletedCount };
  }

  async runAutomatedLifecycleMaintenance(): Promise<{
    pastDueMarked: number;
    expiredDeletedCount: number;
    abandonedFreeDeletedCount: number;
  }> {
    const now = new Date();
    const deleteThreshold = new Date(now.getTime() - THIRTY_DAYS_MS);
    const abandonedFreeThreshold = new Date(now.getTime() - FOURTEEN_DAYS_MS);
    const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase() ?? '';

    let pastDueMarked = 0;
    let expiredDeletedCount = 0;
    let abandonedFreeDeletedCount = 0;

    await this.tenantContext.runWithoutTenant(async () => {
      const [expiredUpdate, abandonedPaid, abandonedFree] = await this.prisma.$transaction(
        async (tx) => {
          const updated = await tx.company.updateMany({
            where: {
              planCode: { not: 'FREE' },
              subscriptionStatus: { in: ['ACTIVE', 'TRIALING'] },
              currentPeriodEnd: { lt: now },
            },
            data: { subscriptionStatus: 'PAST_DUE' },
          });

          const overdueCompanies = await tx.company.findMany({
            where: {
              planCode: { not: 'FREE' },
              subscriptionStatus: { in: ['PAST_DUE', 'SUSPENDED', 'CANCELED'] },
              currentPeriodEnd: { lt: deleteThreshold },
            },
            include: { users: { select: { email: true } } },
            take: 250,
          });

          const emptyFreeCompanies = await tx.company.findMany({
            where: this.buildEmptyCandidateWhere(bootstrapEmail, abandonedFreeThreshold),
            select: { id: true },
            take: 250,
          });

          return [updated.count, overdueCompanies, emptyFreeCompanies] as const;
        },
      );

      pastDueMarked = expiredUpdate;

      for (const company of abandonedPaid) {
        const isProtected =
          Boolean(bootstrapEmail) &&
          company.users.some((u) => u.email?.trim().toLowerCase() === bootstrapEmail);
        if (isProtected) continue;

        await this.deleteCompanyPermanently(company.id);
        expiredDeletedCount += 1;
      }

      for (const company of abandonedFree) {
        await this.deleteCompanyPermanently(company.id);
        abandonedFreeDeletedCount += 1;
      }
    });

    if (expiredDeletedCount > 0 || abandonedFreeDeletedCount > 0) {
      const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
      const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
      if (botToken && chatId) {
        await this.telegramNotifier
          .sendMessage(
            botToken,
            chatId,
            [
              `🧹 <b>Автоочищення SaaS-платформи:</b>`,
              `• Прострочених понад 30 днів видалено: <b>${expiredDeletedCount}</b>`,
              `• Порожніх FREE-акаунтів (>14 дн.) видалено: <b>${abandonedFreeDeletedCount}</b>`,
            ].join('\n'),
          )
          .catch(() => undefined);
      }
    }

    return { pastDueMarked, expiredDeletedCount, abandonedFreeDeletedCount };
  }
}
