import { Injectable, NotFoundException, Inject, MethodNotAllowedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateApiHistoryDto } from './dto/create-apihistory.dto';
import { UpdateApiHistoryDto } from './dto/update-apihistory.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { paginate, type PaginatedResponse } from '../common/pagination/paginate';
import type { ApiHistory } from '@prisma/client';

@Injectable()
export class ApiHistoryService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TenantContext)
    private readonly tenantContext: TenantContext,
  ) {}

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

    return this.prisma.apiHistory.create({
      data: {
        userId,
        companyId: activeCompanyId,
        endpoint: dto.endpoint,
        method: dto.method,
        statusCode: dto.statusCode,
        durationMs: dto.durationMs,
      },
    });
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
      () => this.prisma.apiHistory.count({ where }),
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
