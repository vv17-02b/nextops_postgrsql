import { BadRequestException, ForbiddenException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { paginate, type PaginatedResponse } from '../common/pagination/paginate';
import { toMinorUnits } from '../common/money';
import { PlanEnforcementService } from '../billing/plan-enforcement.service';
import { AuditService } from '../audit/audit.service';
import type { Product } from '@prisma/client';

function escapeCsvCell(value: unknown): string {
  const str = value == null ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

@Injectable()
export class ProductService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TenantContext) private readonly tenantContext: TenantContext,
    @Inject(PlanEnforcementService) private readonly planEnforcement: PlanEnforcementService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async create(dto: CreateProductDto, companyId?: string): Promise<Product> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (!activeCompanyId) throw new ForbiddenException('A business workspace is required.');

    await this.planEnforcement.assertProductLimit(activeCompanyId);

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

  async bulkImport(
    items: CreateProductDto[],
    companyId?: string,
  ): Promise<{ imported: number }> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (!activeCompanyId) throw new ForbiddenException('A business workspace is required.');

    await this.planEnforcement.assertProductLimit(activeCompanyId);

    const categoryIds = [...new Set(items.map((item) => item.categoryId))];
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds }, companyId: activeCompanyId },
      select: { id: true },
    });
    if (categories.length !== categoryIds.length) {
      throw new BadRequestException('Одна або декілька вказаних категорій не існують у вашому робочому просторі.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      let createdCount = 0;
      for (const item of items) {
        const { price, compareAtPrice, ...productData } = item;
        await tx.product.create({
          data: {
            ...productData,
            priceMinor: toMinorUnits(price),
            compareAtPriceMinor: compareAtPrice == null ? null : toMinorUnits(compareAtPrice),
            companyId: activeCompanyId,
          },
        });
        createdCount++;
      }
      return createdCount;
    });

    await this.audit.record({
      companyId: activeCompanyId,
      action: 'PRODUCTS_CSV_IMPORTED',
      entityType: 'Product',
      entityId: activeCompanyId,
      metadata: { importedCount: result },
    });

    return { imported: result };
  }

  async exportCsv(companyId?: string): Promise<string> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (!activeCompanyId) throw new ForbiddenException('A business workspace is required.');

    const products = await this.prisma.product.findMany({
      where: { companyId: activeCompanyId },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });

    const headers = ['id', 'name', 'slug', 'price', 'compareAtPrice', 'isActive', 'categoryId', 'description'];
    const rows = products.map((p) => [
      escapeCsvCell(p.id),
      escapeCsvCell(p.name),
      escapeCsvCell(p.slug),
      escapeCsvCell((p.priceMinor / 100).toFixed(2)),
      escapeCsvCell(p.compareAtPriceMinor == null ? '' : (p.compareAtPriceMinor / 100).toFixed(2)),
      escapeCsvCell(p.isActive ? 'true' : 'false'),
      escapeCsvCell(p.categoryId),
      escapeCsvCell(p.description ?? ''),
    ].join(','));

    return `\uFEFF${headers.join(',')}\n${rows.join('\n')}`;
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
    const existing = await this.findOne(id, companyId);
    const { price, compareAtPrice, ...productData } = dto;
    const nextPriceMinor = price === undefined ? undefined : toMinorUnits(price);

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        ...(nextPriceMinor === undefined ? {} : { priceMinor: nextPriceMinor }),
        ...(compareAtPrice === undefined
          ? {}
          : { compareAtPriceMinor: compareAtPrice === null ? null : toMinorUnits(compareAtPrice) }),
      },
    });

    if (nextPriceMinor !== undefined && nextPriceMinor !== existing.priceMinor) {
      await this.audit.record({
        companyId: existing.companyId,
        action: 'PRODUCT_PRICE_UPDATED',
        entityType: 'Product',
        entityId: id,
        metadata: {
          previousPriceMinor: existing.priceMinor,
          newPriceMinor: nextPriceMinor,
        },
      });
    }

    return updated;
  }

  async remove(id: string, companyId?: string): Promise<Product> {
    await this.findOne(id, companyId);
    return this.prisma.product.delete({ where: { id } });
  }
}
