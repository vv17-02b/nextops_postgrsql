import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Product } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { paginate, type PaginatedResponse } from '../common/pagination/paginate';
import { toMinorUnits } from '../common/money';
import { PlanEnforcementService } from '../billing/plan-enforcement.service';
import { AuditService } from '../audit/audit.service';

function escapeCsvCell(value: unknown, preventFormulaInjection = false): string {
  let str = value == null ? '' : String(value);
  if (preventFormulaInjection && /^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
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
    @Inject(TenantContext)
    private readonly tenantContext: TenantContext,
    @Inject(PlanEnforcementService)
    private readonly planEnforcement: PlanEnforcementService,
    @Inject(AuditService)
    private readonly audit: AuditService,
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

  private async assertCategoriesBelongToCompany(
    categoryIds: string[],
    companyId: string,
  ): Promise<void> {
    const uniqueCategoryIds = [...new Set(categoryIds)];
    if (uniqueCategoryIds.length === 0) return;

    const categories = await this.prisma.category.findMany({
      where: { id: { in: uniqueCategoryIds }, companyId },
      select: { id: true },
    });

    if (categories.length !== uniqueCategoryIds.length) {
      throw new BadRequestException(
        'Одна або декілька вказаних категорій не існують у вашому робочому просторі.',
      );
    }
  }

  async create(dto: CreateProductDto, companyId?: string): Promise<Product> {
    const activeCompanyId = this.resolveCompanyId(companyId);

    await this.planEnforcement.assertProductLimit(activeCompanyId);
    await this.assertCategoriesBelongToCompany([dto.categoryId], activeCompanyId);

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
    const activeCompanyId = this.resolveCompanyId(companyId);

    await this.planEnforcement.assertProductLimit(activeCompanyId);

    const billingSnapshot = await this.planEnforcement.getBillingSnapshot(activeCompanyId);
    if (billingSnapshot.maxProducts !== null) {
      const currentProductsCount = await this.prisma.product.count({
        where: { companyId: activeCompanyId },
      });
      if (currentProductsCount + items.length > billingSnapshot.maxProducts) {
        const remaining = Math.max(0, billingSnapshot.maxProducts - currentProductsCount);
        throw new ForbiddenException(
          `Перевищено ліміт товарів тарифного плану (${billingSnapshot.maxProducts}). Доступно для додавання: ${remaining}.`,
        );
      }
    }

    await this.assertCategoriesBelongToCompany(
      items.map((item) => item.categoryId),
      activeCompanyId,
    );

    const createdCount = await this.prisma.$transaction(async (tx) => {
      const result = await tx.product.createMany({
        data: items.map((item) => {
          const { price, compareAtPrice, ...productData } = item;
          return {
            ...productData,
            images: productData.images ?? [],
            isActive: productData.isActive ?? true,
            priceMinor: toMinorUnits(price),
            compareAtPriceMinor: compareAtPrice == null ? null : toMinorUnits(compareAtPrice),
            companyId: activeCompanyId,
          };
        }),
      });
      return result.count;
    });

    await this.audit.record({
      companyId: activeCompanyId,
      action: 'PRODUCTS_CSV_IMPORTED',
      entityType: 'Product',
      entityId: activeCompanyId,
      metadata: { importedCount: createdCount },
    });

    return { imported: createdCount };
  }

  async exportCsv(companyId?: string): Promise<string> {
    const activeCompanyId = this.resolveCompanyId(companyId);

    const products = await this.prisma.product.findMany({
      where: { companyId: activeCompanyId },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });

    const headers = [
      'id',
      'name',
      'slug',
      'price',
      'compareAtPrice',
      'isActive',
      'categoryId',
      'description',
    ];
    const rows = products.map((p) =>
      [
        escapeCsvCell(p.id),
        escapeCsvCell(p.name, true),
        escapeCsvCell(p.slug, true),
        escapeCsvCell((p.priceMinor / 100).toFixed(2)),
        escapeCsvCell(p.compareAtPriceMinor == null ? '' : (p.compareAtPriceMinor / 100).toFixed(2)),
        escapeCsvCell(p.isActive ? 'true' : 'false'),
        escapeCsvCell(p.categoryId),
        escapeCsvCell(p.description ?? '', true),
      ].join(','),
    );

    return `\uFEFF${headers.join(',')}\n${rows.join('\n')}`;
  }

  async findAll(
    query: PaginationQueryDto,
    companyId?: string,
  ): Promise<PaginatedResponse<Product>> {
    const activeCompanyId = this.resolveCompanyId(companyId);
    const where = { companyId: activeCompanyId };

    return paginate(
      query,
      (skip, take) =>
        this.prisma.product.findMany({
          where,
          skip,
          take,
          include: { category: true },
        }),
      () => this.prisma.product.count({ where }),
    );
  }

  async findOne(id: string, companyId?: string): Promise<Product> {
    const activeCompanyId = this.resolveCompanyId(companyId);
    const item = await this.prisma.product.findFirst({
      where: { id, companyId: activeCompanyId },
      include: { category: true },
    });
    if (!item) {
      throw new NotFoundException(`Товар з ID ${id} не знайдено`);
    }
    return item;
  }

  async update(id: string, dto: UpdateProductDto, companyId?: string): Promise<Product> {
    const existing = await this.findOne(id, companyId);

    if (dto.categoryId !== undefined) {
      await this.assertCategoriesBelongToCompany([dto.categoryId], existing.companyId);
    }

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
