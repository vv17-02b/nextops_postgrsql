import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Warehouse } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { paginate, type PaginatedResponse } from '../common/pagination/paginate';

@Injectable()
export class WarehouseService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TenantContext)
    private readonly tenantContext: TenantContext,
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

  private async assertProductBelongsToCompany(productId: string, companyId: string): Promise<void> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, companyId },
      select: { id: true },
    });
    if (!product) {
      throw new BadRequestException('Вказаний товар не знайдено у вашому робочому просторі.');
    }
  }

  async create(dto: CreateWarehouseDto, companyId?: string): Promise<Warehouse> {
    const activeCompanyId = this.resolveCompanyId(companyId);
    await this.assertProductBelongsToCompany(dto.productId, activeCompanyId);

    return this.prisma.warehouse.create({
      data: {
        companyId: activeCompanyId,
        productId: dto.productId,
        location: dto.location,
        quantity: dto.quantity ?? 0,
      },
    });
  }

  async findAll(
    query: PaginationQueryDto,
    companyId?: string,
  ): Promise<PaginatedResponse<Warehouse>> {
    const activeCompanyId = this.resolveCompanyId(companyId);
    const where = { companyId: activeCompanyId };

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
    const activeCompanyId = this.resolveCompanyId(companyId);
    const item = await this.prisma.warehouse.findFirst({
      where: { id, companyId: activeCompanyId },
    });
    if (!item) {
      throw new NotFoundException(`Запис складу з ID ${id} не знайдено`);
    }
    return item;
  }

  async update(id: string, dto: UpdateWarehouseDto, companyId?: string): Promise<Warehouse> {
    const existing = await this.findOne(id, companyId);

    if (dto.productId !== undefined) {
      await this.assertProductBelongsToCompany(dto.productId, existing.companyId);
    }

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
