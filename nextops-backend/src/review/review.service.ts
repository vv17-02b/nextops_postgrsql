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

  async create(dto: CreateReviewDto): Promise<Review> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) throw new ForbiddenException('A business workspace is required.');
    return this.prisma.review.create({ data: { ...dto, companyId } });
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Review>> {
    return paginate(
      query,
      (skip, take) => this.prisma.review.findMany({ skip, take }),
      () => this.prisma.review.count(),
    );
  }

  async findOne(id: string): Promise<Review> {
    const item = await this.prisma.review.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Відгук з ID ${id} не знайдено`);
    return item;
  }

  async update(id: string, dto: UpdateReviewDto): Promise<Review> {
    await this.findOne(id);
    return this.prisma.review.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string): Promise<Review> {
    await this.findOne(id);
    return this.prisma.review.delete({ where: { id } });
  }
}
