import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import type { Product } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';
export declare class ProductController {
    private readonly service;
    constructor(service: ProductService);
    create(dto: CreateProductDto): Promise<Product>;
    findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Product>>;
    findOne(id: string): Promise<Product>;
    update(id: string, dto: UpdateProductDto): Promise<Product>;
    remove(id: string): Promise<Product>;
}
