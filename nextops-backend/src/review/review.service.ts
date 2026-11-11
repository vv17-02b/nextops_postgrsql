import { ForbiddenException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { paginate, type PaginatedResponse } from '../common/pagination/paginate';
import type { Review } from '@prisma/client';

@Injectable()
export class ReviewService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TenantContext) private readonly tenantContext: TenantContext,
  ) {}

  async create(dto: CreateReviewDto, companyId?: string): Promise<Review> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (!activeCompanyId) throw new ForbiddenException('A business workspace is required.');
    return this.prisma.review.create({ data: { ...dto, companyId: activeCompanyId } });
  }

  async findAll(query: PaginationQueryDto, companyId?: string): Promise<PaginatedResponse<Review>> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    const where = activeCompanyId ? { companyId: activeCompanyId } : {};

    return paginate(
      query,
      (skip, take) => this.prisma.review.findMany({ where, skip, take }),
      () => this.prisma.review.count({ where }),
    );
  }

  async findOne(id: string, companyId?: string): Promise<Review> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    const item = await this.prisma.review.findFirst({
      where: activeCompanyId ? { id, companyId: activeCompanyId } : { id },
    });
    if (!item) throw new NotFoundException(`Відгук з ID ${id} не знайдено`);
    return item;
  }

  async update(id: string, dto: UpdateReviewDto, companyId?: string): Promise<Review> {
    await this.findOne(id, companyId);
    return this.prisma.review.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, companyId?: string): Promise<Review> {
    await this.findOne(id, companyId);
    return this.prisma.review.delete({ where: { id } });
  }
}
