import { ForbiddenException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { paginate, type PaginatedResponse } from '../common/pagination/paginate';
import type { Category } from '@prisma/client';

@Injectable()
export class CategoryService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TenantContext) private readonly tenantContext: TenantContext,
  ) {}

  async create(dto: CreateCategoryDto, companyId?: string): Promise<Category> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (!activeCompanyId) throw new ForbiddenException('A business workspace is required.');
    return this.prisma.category.create({ data: { ...dto, companyId: activeCompanyId } });
  }

  async findAll(query: PaginationQueryDto, companyId?: string): Promise<PaginatedResponse<Category>> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    const where = activeCompanyId ? { companyId: activeCompanyId } : {};

    return paginate(
      query,
      (skip, take) => this.prisma.category.findMany({ where, skip, take }),
      () => this.prisma.category.count({ where }),
    );
  }

  async findOne(id: string, companyId?: string): Promise<Category> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    const item = await this.prisma.category.findFirst({
      where: activeCompanyId ? { id, companyId: activeCompanyId } : { id },
    });
    if (!item) throw new NotFoundException(`Категорію з ID ${id} не знайдено`);
    return item;
  }

  async update(id: string, dto: UpdateCategoryDto, companyId?: string): Promise<Category> {
    await this.findOne(id, companyId);
    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, companyId?: string): Promise<Category> {
    await this.findOne(id, companyId);
    return this.prisma.category.delete({ where: { id } });
  }
}
