import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { type PaginatedResponse } from '../common/pagination/paginate';
import type { Product } from '@prisma/client';
export declare class ProductService {
    private readonly prisma;
    private readonly tenantContext;
    constructor(prisma: PrismaService, tenantContext: TenantContext);
    create(dto: CreateProductDto): Promise<Product>;
    findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Product>>;
    findOne(id: string): Promise<Product>;
    update(id: string, dto: UpdateProductDto): Promise<Product>;
    remove(id: string): Promise<Product>;
}
