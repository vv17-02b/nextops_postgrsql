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

interface RequestWithUser extends Request {
  user: {
    id: string;
    email?: string;
    role?: string;
    companyId?: string;
  };
}

@Controller('order')
export class OrderController {
  constructor(
    @Inject(OrderService)
    private readonly service: OrderService,
  ) {}

  @Post()
  @Idempotent()
  create(
    @Body() dto: CreateOrderDto,
    @Req() request: RequestWithUser,
  ): Promise<Order> {
    return this.service.create(dto, request.user.id, request.user.companyId);
  }

  @Get()
  findAll(
    @Query() query: PaginationQueryDto,
    @Req() request: RequestWithUser,
  ): Promise<PaginatedResponse<Order>> {
    return this.service.findAll(query, request.user.companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() request: RequestWithUser): Promise<Order> {
    return this.service.findOne(id, request.user.companyId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
    @Req() request: RequestWithUser,
  ): Promise<Order> {
    return this.service.update(id, dto, request.user.companyId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: RequestWithUser): Promise<Order> {
    return this.service.remove(id, request.user.companyId);
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
