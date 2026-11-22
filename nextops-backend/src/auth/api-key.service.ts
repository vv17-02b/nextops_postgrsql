import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { createClient } from 'redis';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';

export interface ValidatedApiKeyContext {
  keyId: string;
  companyId: string;
  name: string;
  scopes: string[];
}

export interface ApiKeySummary {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface ApiKeyQuotaSummary {
  used: number;
  limit: number;
  planCode: string;
}

const ALLOWED_SCOPES = new Set([
  'read:products',
  'write:products',
  'read:orders',
  'write:orders',
  'read:reviews',
  'write:reviews',
  'read:warehouses',
]);

const PLAN_API_KEY_LIMITS: Record<string, number> = {
  FREE: 3,
  PRO: 10,
  ENTERPRISE: 50,
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['ACTIVE', 'TRIALING']);

function resolveKeyLimitForPlan(planCode: string): number {
  const normalized = planCode.trim().toUpperCase();
  return PLAN_API_KEY_LIMITS[normalized] ?? 3;
}

@Injectable()
export class ApiKeyService implements OnModuleInit, OnModuleDestroy {
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

  private hashKey(rawKey: string): string {
    return createHash('sha256').update(rawKey.trim(), 'utf8').digest('hex');
  }

  private cacheKey(keyHash: string): string {
    return `nextops:apikey:${keyHash}`;
  }

  async createKey(
    name: string,
    requestedScopes?: string[],
    companyId?: string,
    expiresInDays?: number,
  ): Promise<ApiKeySummary & { apiKey: string }> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (!activeCompanyId) {
      throw new ForbiddenException('A business workspace is required.');
    }

    const cleanName = name.trim();
    if (!cleanName) {
      throw new BadRequestException('Вкажіть назву API-ключа (наприклад, "Інтернет-магазин").');
    }

    const [company, existingCount] = await Promise.all([
      this.prisma.company.findUnique({
        where: { id: activeCompanyId },
        select: { planCode: true, subscriptionStatus: true },
      }),
      this.prisma.companyApiKey.count({
        where: { companyId: activeCompanyId, isActive: true },
      }),
    ]);

    if (!company) {
      throw new ForbiddenException('Робочий простір компанії не знайдено.');
    }

    if (!ACTIVE_SUBSCRIPTION_STATUSES.has(company.subscriptionStatus)) {
      throw new ForbiddenException(
        `Створення API-ключів призупинено: статус підписки "${company.subscriptionStatus}". Оновіть оплату в розділі Білінг.`,
      );
    }

    const maxKeysForPlan = resolveKeyLimitForPlan(company.planCode);
    if (existingCount >= maxKeysForPlan) {
      throw new ForbiddenException(
        `Досягнуто ліміт API-ключів (${maxKeysForPlan}) для тарифу ${company.planCode}. Відкличте невикористаний ключ або перейдіть на вищий тариф.`,
      );
    }

    const scopes =
      Array.isArray(requestedScopes) && requestedScopes.length > 0
        ? requestedScopes.filter((s) => ALLOWED_SCOPES.has(s))
        : ['read:products', 'write:orders', 'write:reviews'];

    if (scopes.length === 0) {
      throw new BadRequestException('Оберіть хоча б один коректний дозвіл (scope).');
    }

    let expiresAt: Date | null = null;
    if (typeof expiresInDays === 'number' && Number.isFinite(expiresInDays) && expiresInDays > 0) {
      const clampedDays = Math.min(3650, Math.floor(expiresInDays));
      expiresAt = new Date(Date.now() + clampedDays * 24 * 60 * 60 * 1000);
    }

    const rawKey = `nx_live_${randomBytes(24).toString('hex')}`;
    const keyHash = this.hashKey(rawKey);
    const prefix = rawKey.slice(0, 12);

    const record = await this.prisma.companyApiKey.create({
      data: {
        companyId: activeCompanyId,
        name: cleanName,
        keyHash,
        prefix,
        scopes,
        expiresAt,
      },
    });

    await this.prisma.auditLog
      .create({
        data: {
          companyId: activeCompanyId,
          action: 'API_KEY_CREATED',
          entityType: 'CompanyApiKey',
          entityId: record.id,
          metadata: {
            name: record.name,
            prefix: record.prefix,
            scopes: record.scopes,
            expiresAt: record.expiresAt ? record.expiresAt.toISOString() : null,
          },
        },
      })
      .catch(() => undefined);

    return {
      id: record.id,
      name: record.name,
      prefix: record.prefix,
      scopes: record.scopes,
      isActive: record.isActive,
      lastUsedAt: null,
      expiresAt: record.expiresAt ? record.expiresAt.toISOString() : null,
      createdAt: record.createdAt.toISOString(),
      apiKey: rawKey,
    };
  }

  async listKeys(
    companyId?: string,
  ): Promise<{ keys: ApiKeySummary[]; quota: ApiKeyQuotaSummary }> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (!activeCompanyId) {
      throw new ForbiddenException('A business workspace is required.');
    }

    const [rows, company] = await Promise.all([
      this.prisma.companyApiKey.findMany({
        where: { companyId: activeCompanyId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.company.findUnique({
        where: { id: activeCompanyId },
        select: { planCode: true },
      }),
    ]);

    const planCode = company?.planCode ?? 'FREE';
    const limit = resolveKeyLimitForPlan(planCode);
    const activeCount = rows.filter((row) => row.isActive).length;

    return {
      keys: rows.map((row) => ({
        id: row.id,
        name: row.name,
        prefix: row.prefix,
        scopes: row.scopes,
        isActive: row.isActive,
        lastUsedAt: row.lastUsedAt ? row.lastUsedAt.toISOString() : null,
        expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
      })),
      quota: {
        used: activeCount,
        limit,
        planCode,
      },
    };
  }

  async revokeKey(keyId: string, companyId?: string): Promise<{ revoked: true }> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (!activeCompanyId) {
      throw new ForbiddenException('A business workspace is required.');
    }

    const existing = await this.prisma.companyApiKey.findFirst({
      where: { id: keyId, companyId: activeCompanyId },
      select: { id: true, keyHash: true, name: true, prefix: true },
    });

    if (!existing) {
      return { revoked: true };
    }

    await this.prisma.companyApiKey.delete({
      where: { id: existing.id },
    });

    if (this.redis?.isReady) {
      await this.redis.del(this.cacheKey(existing.keyHash)).catch(() => undefined);
    }

    await this.prisma.auditLog
      .create({
        data: {
          companyId: activeCompanyId,
          action: 'API_KEY_REVOKED',
          entityType: 'CompanyApiKey',
          entityId: existing.id,
          metadata: { name: existing.name, prefix: existing.prefix },
        },
      })
      .catch(() => undefined);

    return { revoked: true };
  }

  async validateRawApiKey(rawKey: string): Promise<ValidatedApiKeyContext | null> {
    const trimmed = rawKey.trim();
    if (!trimmed.startsWith('nx_live_') || trimmed.length < 24) {
      return null;
    }

    const keyHash = this.hashKey(trimmed);

    if (this.redis?.isReady) {
      const cached = await this.redis.get(this.cacheKey(keyHash)).catch(() => null);
      if (cached) {
        try {
          return JSON.parse(cached) as ValidatedApiKeyContext;
        } catch {
          // Fallback to DB lookup if cached payload is malformed
        }
      }
    }

    const record = await this.prisma.runSystemQuery(() =>
      this.prisma.$transaction((tx) =>
        tx.companyApiKey.findUnique({
          where: { keyHash },
          select: {
            id: true,
            companyId: true,
            name: true,
            scopes: true,
            isActive: true,
            expiresAt: true,
            company: {
              select: {
                subscriptionStatus: true,
              },
            },
          },
        }),
      ),
    );

    if (!record || !record.isActive) {
      return null;
    }

    if (!ACTIVE_SUBSCRIPTION_STATUSES.has(record.company.subscriptionStatus)) {
      return null;
    }

    if (record.expiresAt && record.expiresAt.getTime() <= Date.now()) {
      return null;
    }

    const context: ValidatedApiKeyContext = {
      keyId: record.id,
      companyId: record.companyId,
      name: record.name,
      scopes: record.scopes,
    };

    if (this.redis?.isReady) {
      await this.redis
        .set(this.cacheKey(keyHash), JSON.stringify(context), { EX: 60 })
        .catch(() => undefined);
    }

    void this.prisma
      .runSystemQuery(() =>
        this.prisma.$transaction((tx) =>
          tx.companyApiKey.update({
            where: { id: record.id },
            data: { lastUsedAt: new Date() },
          }),
        ),
      )
      .catch(() => undefined);

    return context;
  }
}
