import { Controller, Get, Post, Body, Param, Delete, Patch, Inject, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { WarehouseService } from './warehouse.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import type { Warehouse } from '@prisma/client';
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

@Controller('warehouse')
export class WarehouseController {
  constructor(
    @Inject(WarehouseService)
    private readonly service: WarehouseService,
  ) {}

  @Post()
  async create(@Body() dto: CreateWarehouseDto, @Req() req: RequestWithUser): Promise<Warehouse> {
    return this.service.create(dto, req.user?.companyId);
  }

  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
    @Req() req: RequestWithUser,
  ): Promise<PaginatedResponse<Warehouse>> {
    return this.service.findAll(query, req.user?.companyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: RequestWithUser): Promise<Warehouse> {
    return this.service.findOne(id, req.user?.companyId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWarehouseDto,
    @Req() req: RequestWithUser,
  ): Promise<Warehouse> {
    return this.service.update(id, dto, req.user?.companyId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: RequestWithUser): Promise<Warehouse> {
    return this.service.remove(id, req.user?.companyId);
  }
}
