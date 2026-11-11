import { ForbiddenException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { paginate, type PaginatedResponse } from '../common/pagination/paginate';
import { toMinorUnits } from '../common/money';
import type { Product } from '@prisma/client';

@Injectable()
export class ProductService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TenantContext) private readonly tenantContext: TenantContext,
  ) {}

  async create(dto: CreateProductDto, companyId?: string): Promise<Product> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (!activeCompanyId) throw new ForbiddenException('A business workspace is required.');
    const { price, compareAtPrice, ...productData } = dto;
    return this.prisma.product.create({
      data: {
        ...productData,
        priceMinor: toMinorUnits(price),
        compareAtPriceMinor: compareAtPrice == null ? null : toMinorUnits(compareAtPrice),
        companyId: activeCompanyId,
      },
    });
  }

  async findAll(query: PaginationQueryDto, companyId?: string): Promise<PaginatedResponse<Product>> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    const where = activeCompanyId ? { companyId: activeCompanyId } : {};

    return paginate(
      query,
      (skip, take) => this.prisma.product.findMany({
        where,
        skip,
        take,
        include: { category: true },
      }),
      () => this.prisma.product.count({ where }),
    );
  }

  async findOne(id: string, companyId?: string): Promise<Product> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    const item = await this.prisma.product.findFirst({
      where: activeCompanyId ? { id, companyId: activeCompanyId } : { id },
      include: { category: true },
    });
    if (!item) throw new NotFoundException(`Товар з ID ${id} не знайдено`);
    return item;
  }

  async update(id: string, dto: UpdateProductDto, companyId?: string): Promise<Product> {
    await this.findOne(id, companyId);
    const { price, compareAtPrice, ...productData } = dto;
    return this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        ...(price === undefined ? {} : { priceMinor: toMinorUnits(price) }),
        ...(compareAtPrice === undefined
          ? {}
          : { compareAtPriceMinor: compareAtPrice === null ? null : toMinorUnits(compareAtPrice) }),
      },
    });
  }

  async remove(id: string, companyId?: string): Promise<Product> {
    await this.findOne(id, companyId);
    return this.prisma.product.delete({ where: { id } });
  }
}
