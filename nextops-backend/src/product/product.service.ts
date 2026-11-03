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

  async create(dto: CreateProductDto): Promise<Product> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) throw new ForbiddenException('A business workspace is required.');
    const { price, compareAtPrice, ...productData } = dto;
    return this.prisma.product.create({
      data: {
        ...productData,
        priceMinor: toMinorUnits(price),
        compareAtPriceMinor: compareAtPrice == null ? null : toMinorUnits(compareAtPrice),
        companyId,
      },
    });
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Product>> {
    return paginate(
      query,
      (skip, take) => this.prisma.product.findMany({
        skip,
        take,
        include: { category: true },
      }),
      () => this.prisma.product.count(),
    );
  }

  async findOne(id: string): Promise<Product> {
    const item = await this.prisma.product.findUnique({ 
      where: { id },
      include: { category: true }
    });
    if (!item) throw new NotFoundException(`Товар з ID ${id} не знайдено`);
    return item;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    await this.findOne(id);
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

  async remove(id: string): Promise<Product> {
    await this.findOne(id);
    return this.prisma.product.delete({ where: { id } });
  }
}
