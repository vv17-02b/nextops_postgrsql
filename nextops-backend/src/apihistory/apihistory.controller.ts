import { Controller, Get, Post, Body, Param, Delete, Patch, Inject, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ApiHistoryService } from './apihistory.service';
import { CreateApiHistoryDto } from './dto/create-apihistory.dto';
import { UpdateApiHistoryDto } from './dto/update-apihistory.dto';
import type { ApiHistory } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';

@Controller('apihistory')
export class ApiHistoryController {
  constructor(
    @Inject(ApiHistoryService)
    private readonly service: ApiHistoryService
  ) {}

  @Post()
  create(
    @Body() dto: CreateApiHistoryDto,
    @Req() request: Request & { user: { id: string } },
  ): Promise<ApiHistory> {
    return this.service.create(dto, request.user.id);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto): Promise<PaginatedResponse<ApiHistory>> {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ApiHistory> { 
    return this.service.findOne(id); 
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateApiHistoryDto): Promise<ApiHistory> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<ApiHistory> { 
    return this.service.remove(id); 
  }
}
