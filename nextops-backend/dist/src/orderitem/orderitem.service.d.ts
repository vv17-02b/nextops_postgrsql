import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateOrderItemDto } from './dto/create-orderitem.dto';
import { UpdateOrderItemDto } from './dto/update-orderitem.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { type PaginatedResponse } from '../common/pagination/paginate';
import type { OrderItem } from '@prisma/client';
export declare class OrderItemService {
    private readonly prisma;
    private readonly tenantContext;
    constructor(prisma: PrismaService, tenantContext: TenantContext);
    create(dto: CreateOrderItemDto): Promise<OrderItem>;
    findAll(query: PaginationQueryDto): Promise<PaginatedResponse<OrderItem>>;
    findOne(id: string): Promise<OrderItem>;
    update(id: string, dto: UpdateOrderItemDto): Promise<OrderItem>;
    remove(id: string): Promise<OrderItem>;
}
