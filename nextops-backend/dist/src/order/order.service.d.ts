import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { type PaginatedResponse } from '../common/pagination/paginate';
import type { Order } from '@prisma/client';
export declare class OrderService {
    private readonly prisma;
    private readonly tenantContext;
    constructor(prisma: PrismaService, tenantContext: TenantContext);
    create(dto: CreateOrderDto, userId: string): Promise<Order>;
    findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Order>>;
    findOne(id: string): Promise<Order>;
    update(id: string, dto: UpdateOrderDto): Promise<Order>;
    remove(id: string): Promise<Order>;
}
