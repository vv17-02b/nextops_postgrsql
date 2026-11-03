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

  async create(dto: CreateCategoryDto): Promise<Category> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) throw new ForbiddenException('A business workspace is required.');
    return this.prisma.category.create({ data: { ...dto, companyId } });
  }

  // 🌟 Спрощено: прибираємо include для стабільного першого запуску NoSQL
  async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Category>> {
    return paginate(
      query,
      (skip, take) => this.prisma.category.findMany({ skip, take }),
      () => this.prisma.category.count(),
    );
  }

  // 🌟 Спрощено: шукаємо документ суто за його унікальним ID
  async findOne(id: string): Promise<Category> {
    const item = await this.prisma.category.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Категорію з ID ${id} не знайдено`);
    return item;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    await this.findOne(id);
    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string): Promise<Category> {
    await this.findOne(id);
    return this.prisma.category.delete({ where: { id } });
  }
}
