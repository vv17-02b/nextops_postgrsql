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
} from '@nestjs/common';
import type { Request } from 'express';
import type { ApiHistory } from '@prisma/client';
import { ApiHistoryService } from './apihistory.service';
import { CreateApiHistoryDto } from './dto/create-apihistory.dto';
import { UpdateApiHistoryDto } from './dto/update-apihistory.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
    companyId?: string;
  };
}

@Controller('apihistory')
export class ApiHistoryController {
  constructor(
    @Inject(ApiHistoryService)
    private readonly service: ApiHistoryService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateApiHistoryDto,
    @Req() request: RequestWithUser,
  ): Promise<ApiHistory> {
    return this.service.create(dto, request.user?.id, request.user?.companyId, request.user?.role);
  }

  @Get()
  findAll(
    @Query() query: PaginationQueryDto,
    @Req() request: RequestWithUser,
  ): Promise<PaginatedResponse<ApiHistory>> {
    return this.service.findAll(query, request.user?.companyId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: RequestWithUser,
  ): Promise<ApiHistory> {
    return this.service.findOne(id, request.user?.companyId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApiHistoryDto,
  ): Promise<ApiHistory> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<ApiHistory> {
    return this.service.remove(id);
  }
}
