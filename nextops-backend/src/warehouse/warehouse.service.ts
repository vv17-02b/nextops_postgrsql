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

  async create(dto: CreateWarehouseDto): Promise<Warehouse> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) throw new ForbiddenException('A business workspace is required.');
    return this.prisma.warehouse.create({
      data: {
        companyId,
        productId: dto.productId,
        location: dto.location,
        quantity: dto.quantity ?? 0,
      },
    });
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Warehouse>> {
    return paginate(
      query,
      (skip, take) => this.prisma.warehouse.findMany({
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
      }),
      () => this.prisma.warehouse.count(),
    );
  }

  async findOne(id: string): Promise<Warehouse> {
    const item = await this.prisma.warehouse.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Запис складу з ID ${id} не знайдено`);
    }
    return item;
  }

  async update(id: string, dto: UpdateWarehouseDto): Promise<Warehouse> {
    await this.findOne(id);
    return this.prisma.warehouse.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string): Promise<Warehouse> {
    await this.findOne(id);
    return this.prisma.warehouse.delete({ where: { id } });
  }
}
