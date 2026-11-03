import type { Request } from 'express';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';
import type { Order } from '@prisma/client';
export declare class OrderController {
    private readonly service;
    constructor(service: OrderService);
    create(dto: CreateOrderDto, request: Request & {
        user: {
            id: string;
        };
    }): Promise<Order>;
    findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Order>>;
    findOne(id: string): Promise<Order>;
    update(id: string, dto: UpdateOrderDto): Promise<Order>;
    remove(id: string): Promise<Order>;
    pay(): never;
}
