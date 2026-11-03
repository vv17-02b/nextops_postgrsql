import { Controller, Get, Post, Body, Param, Delete, Patch, Inject, Query, UseGuards, ServiceUnavailableException, Req } from '@nestjs/common';
import type { Request } from 'express';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';
import type { Order } from '@prisma/client';

import { Idempotent } from '../common/idempotency/idempotency.interceptor';

@Controller('order')
export class OrderController {
  // Примусове впровадження через декоратор @Inject
  constructor(
    @Inject(OrderService)
    private readonly service: OrderService,
  ) {}

  @Post()
  @Idempotent()
  create(
    @Body() dto: CreateOrderDto,
    @Req() request: Request & { user: { id: string } },
  ): Promise<Order> {
    return this.service.create(dto, request.user.id);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto): Promise<PaginatedResponse<Order>> {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Order> { 
    return this.service.findOne(id); 
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto): Promise<Order> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<Order> { 
    return this.service.remove(id); 
  }

  @Patch(':id/pay')
  @UseGuards(JwtAuthGuard)
  pay(): never {
    throw new ServiceUnavailableException({
      message: 'Payment confirmation is disabled until a signed payment provider webhook is configured.',
      errorCode: 'PAYMENT_PROVIDER_NOT_CONFIGURED',
    });
  }
}
