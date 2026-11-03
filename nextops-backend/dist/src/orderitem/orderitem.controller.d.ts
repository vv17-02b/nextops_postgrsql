import { OrderItemService } from './orderitem.service';
import { CreateOrderItemDto } from './dto/create-orderitem.dto';
import { UpdateOrderItemDto } from './dto/update-orderitem.dto';
import type { OrderItem } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';
export declare class OrderItemController {
    private readonly service;
    constructor(service: OrderItemService);
    create(dto: CreateOrderItemDto): Promise<OrderItem>;
    findAll(query: PaginationQueryDto): Promise<PaginatedResponse<OrderItem>>;
    findOne(id: string): Promise<OrderItem>;
    update(id: string, dto: UpdateOrderItemDto): Promise<OrderItem>;
    remove(id: string): Promise<OrderItem>;
}
