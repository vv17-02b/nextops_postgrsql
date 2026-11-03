import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { type PaginatedResponse } from '../common/pagination/paginate';
import type { Warehouse } from '@prisma/client';
export declare class WarehouseService {
    private readonly prisma;
    private readonly tenantContext;
    constructor(prisma: PrismaService, tenantContext: TenantContext);
    create(dto: CreateWarehouseDto): Promise<Warehouse>;
    findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Warehouse>>;
    findOne(id: string): Promise<Warehouse>;
    update(id: string, dto: UpdateWarehouseDto): Promise<Warehouse>;
    remove(id: string): Promise<Warehouse>;
}
