import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  MethodNotAllowedException,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import type { ApiHistory } from '@prisma/client';
import { createClient } from 'redis';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateApiHistoryDto } from './dto/create-apihistory.dto';
import { UpdateApiHistoryDto } from './dto/update-apihistory.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { paginate, type PaginatedResponse } from '../common/pagination/paginate';

@Injectable()
export class ApiHistoryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ApiHistoryService.name);
  private readonly redis = process.env.REDIS_URL
    ? createClient({ url: process.env.REDIS_URL })
    : null;

  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TenantContext)
    private readonly tenantContext: TenantContext,
  ) {
    this.redis?.on('error', (error: Error) => {
      this.logger.warn(`Redis error in ApiHistoryService: ${error.message}`);
    });
  }

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

  private getCountCacheKey(companyId: string): string {
    return `nextops:apihistory:count:${companyId}`;
  }

  async create(
    dto: CreateApiHistoryDto,
    userId?: string,
    companyId?: string,
    userRole?: string,
  ): Promise<ApiHistory> {
    const activeCompanyId = this.resolveCompanyId(companyId);
    const resolvedUserId = userRole !== 'API_CLIENT' && userId ? userId : null;

    const created = await this.prisma.apiHistory.create({
      data: {
        userId: resolvedUserId,
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
    const activeCompanyId = this.resolveCompanyId(companyId);
    const where = { companyId: activeCompanyId };

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
    const activeCompanyId = this.resolveCompanyId(companyId);
    const item = await this.prisma.apiHistory.findFirst({
      where: { id, companyId: activeCompanyId },
    });
    if (!item) {
      throw new NotFoundException(`Запис логу з ID ${id} не знайдено`);
    }
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
