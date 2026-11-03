import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { type PaginatedResponse } from '../common/pagination/paginate';
import type { Review } from '@prisma/client';
export declare class ReviewService {
    private readonly prisma;
    private readonly tenantContext;
    constructor(prisma: PrismaService, tenantContext: TenantContext);
    create(dto: CreateReviewDto): Promise<Review>;
    findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Review>>;
    findOne(id: string): Promise<Review>;
    update(id: string, dto: UpdateReviewDto): Promise<Review>;
    remove(id: string): Promise<Review>;
}
