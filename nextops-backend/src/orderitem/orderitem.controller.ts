import { Controller, Get, Post, Body, Param, Delete, Patch, Inject, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { OrderItemService } from './orderitem.service';
import { CreateOrderItemDto } from './dto/create-orderitem.dto';
import { UpdateOrderItemDto } from './dto/update-orderitem.dto';
import type { OrderItem } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    companyId?: string;
  };
}

@Controller('orderitem')
export class OrderItemController {
  constructor(
    @Inject(OrderItemService)
    private readonly service: OrderItemService,
  ) {}

  @Post()
  async create(@Body() dto: CreateOrderItemDto, @Req() req: RequestWithUser): Promise<OrderItem> {
    return this.service.create(dto, req.user?.companyId);
  }

  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
    @Req() req: RequestWithUser,
  ): Promise<PaginatedResponse<OrderItem>> {
    return this.service.findAll(query, req.user?.companyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: RequestWithUser): Promise<OrderItem> {
    return this.service.findOne(id, req.user?.companyId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOrderItemDto,
    @Req() req: RequestWithUser,
  ): Promise<OrderItem> {
    return this.service.update(id, dto, req.user?.companyId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: RequestWithUser): Promise<OrderItem> {
    return this.service.remove(id, req.user?.companyId);
  }
}
