import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { Order } from '@prisma/client';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
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

@Controller('order')
export class OrderController {
  constructor(
    @Inject(OrderService)
    private readonly service: OrderService,
  ) {}

  @Post()
  async create(@Body() dto: CreateOrderDto, @Req() req: RequestWithUser): Promise<Order> {
    if (!req.user?.id) {
      throw new UnauthorizedException('Authentication is required.');
    }
    return this.service.create(dto, req.user.id, req.user.companyId);
  }

  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
    @Req() req: RequestWithUser,
  ): Promise<PaginatedResponse<Order>> {
    return this.service.findAll(query, req.user?.companyId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ): Promise<Order> {
    return this.service.findOne(id, req.user?.companyId);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderDto,
    @Req() req: RequestWithUser,
  ): Promise<Order> {
    return this.service.update(id, dto, req.user?.companyId, req.user?.role);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ): Promise<Order> {
    return this.service.remove(id, req.user?.companyId);
  }
}
