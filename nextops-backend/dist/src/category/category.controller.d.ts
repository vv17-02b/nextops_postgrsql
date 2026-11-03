import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import type { Category } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';
export declare class CategoryController {
    private readonly service;
    constructor(service: CategoryService);
    create(dto: CreateCategoryDto): Promise<Category>;
    findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Category>>;
    findOne(id: string): Promise<Category>;
    update(id: string, dto: UpdateCategoryDto): Promise<Category>;
    remove(id: string): Promise<Category>;
}
