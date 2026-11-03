import { WarehouseService } from './warehouse.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import type { Warehouse } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';
export declare class WarehouseController {
    private readonly service;
    constructor(service: WarehouseService);
    create(dto: CreateWarehouseDto): Promise<Warehouse>;
    findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Warehouse>>;
    findOne(id: string): Promise<Warehouse>;
    update(id: string, dto: UpdateWarehouseDto): Promise<Warehouse>;
    remove(id: string): Promise<Warehouse>;
}
