import { ForbiddenException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { paginate, type PaginatedResponse } from '../common/pagination/paginate';
import type { Warehouse } from '@prisma/client';

@Injectable()
export class WarehouseService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TenantContext) private readonly tenantContext: TenantContext,
  ) {}

  async create(dto: CreateWarehouseDto, companyId?: string): Promise<Warehouse> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (!activeCompanyId) throw new ForbiddenException('A business workspace is required.');
    return this.prisma.warehouse.create({
      data: {
        companyId: activeCompanyId,
        productId: dto.productId,
        location: dto.location,
        quantity: dto.quantity ?? 0,
      },
    });
  }

  async findAll(query: PaginationQueryDto, companyId?: string): Promise<PaginatedResponse<Warehouse>> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    const where = activeCompanyId ? { companyId: activeCompanyId } : {};

    return paginate(
      query,
      (skip, take) =>
        this.prisma.warehouse.findMany({
          where,
          skip,
          take,
          orderBy: { updatedAt: 'desc' },
        }),
      () => this.prisma.warehouse.count({ where }),
    );
  }

  async findOne(id: string, companyId?: string): Promise<Warehouse> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    const item = await this.prisma.warehouse.findFirst({
      where: activeCompanyId ? { id, companyId: activeCompanyId } : { id },
    });
    if (!item) {
      throw new NotFoundException(`Запис складу з ID ${id} не знайдено`);
    }
    return item;
  }

  async update(id: string, dto: UpdateWarehouseDto, companyId?: string): Promise<Warehouse> {
    await this.findOne(id, companyId);
    return this.prisma.warehouse.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, companyId?: string): Promise<Warehouse> {
    await this.findOne(id, companyId);
    return this.prisma.warehouse.delete({ where: { id } });
  }
}
