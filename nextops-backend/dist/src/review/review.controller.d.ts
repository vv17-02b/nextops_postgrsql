import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import type { Review } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';
export declare class ReviewController {
    private readonly service;
    constructor(service: ReviewService);
    create(dto: CreateReviewDto): Promise<Review>;
    findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Review>>;
    findOne(id: string): Promise<Review>;
    update(id: string, dto: UpdateReviewDto): Promise<Review>;
    remove(id: string): Promise<Review>;
}
