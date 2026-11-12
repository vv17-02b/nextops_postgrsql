import { Injectable, NotFoundException, Inject, MethodNotAllowedException, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateApiHistoryDto } from './dto/create-apihistory.dto';
import { UpdateApiHistoryDto } from './dto/update-apihistory.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { paginate, type PaginatedResponse } from '../common/pagination/paginate';
import type { ApiHistory } from '@prisma/client';
import { createClient } from 'redis';

@Injectable()
export class ApiHistoryService implements OnModuleInit, OnModuleDestroy {
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

  private getCountCacheKey(companyId?: string | null): string {
    return `nextops:apihistory:count:${companyId ?? 'global'}`;
  }

  async create(dto: CreateApiHistoryDto, userId: string, companyId?: string): Promise<ApiHistory> {
    let activeCompanyId = companyId ?? this.tenantContext.getCompanyId();

    if (!activeCompanyId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });
      if (!user || !user.companyId) {
        throw new NotFoundException(`Користувача або його робочу область не знайдено`);
      }
      activeCompanyId = user.companyId;
    }

    const created = await this.prisma.apiHistory.create({
      data: {
        userId,
        companyId: activeCompanyId,
        endpoint: dto.endpoint,
        method: dto.method,
        statusCode: dto.statusCode,
        durationMs: dto.durationMs,
      },
    });

    if (this.redis?.isReady) {
      await this.redis.del(this.getCountCacheKey(activeCompanyId)).catch(() => undefined);
    }

    return created;
  }

  async findAll(
    query: PaginationQueryDto,
    companyId?: string,
  ): Promise<PaginatedResponse<ApiHistory>> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    const where = activeCompanyId ? { companyId: activeCompanyId } : {};

    return paginate(
      query,
      (skip, take) =>
        this.prisma.apiHistory.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
      async () => {
        const cacheKey = this.getCountCacheKey(activeCompanyId);
        if (this.redis?.isReady) {
          const cached = await this.redis.get(cacheKey).catch(() => null);
          if (cached !== null) return Number(cached);
        }
        const total = await this.prisma.apiHistory.count({ where });
        if (this.redis?.isReady) {
          await this.redis.set(cacheKey, String(total), { EX: 30 }).catch(() => undefined);
        }
        return total;
      },
    );
  }

  async findOne(id: string, companyId?: string): Promise<ApiHistory> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    const item = await this.prisma.apiHistory.findFirst({
      where: activeCompanyId ? { id, companyId: activeCompanyId } : { id },
    });
    if (!item) throw new NotFoundException(`Запис логу з ID ${id} не знайдено`);
    return item;
  }

  async update(id: string, dto: UpdateApiHistoryDto): Promise<ApiHistory> {
    void id;
    void dto;
    throw new MethodNotAllowedException('Оновлення записів ApiHistory заборонено політикою бази даних');
  }

  async remove(id: string): Promise<ApiHistory> {
    void id;
    throw new MethodNotAllowedException('Видалення окремих записів ApiHistory заборонено політикою бази даних');
  }
}
