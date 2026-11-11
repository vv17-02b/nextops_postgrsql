import { Controller, Get, Post, Body, Param, Delete, Patch, Inject, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { SessionService } from './session.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import type { Session } from '@prisma/client';
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

@Controller('session')
export class SessionController {
  constructor(
    @Inject(SessionService)
    private readonly service: SessionService,
  ) {}

  @Post()
  create(@Body() dto: CreateSessionDto, @Req() req: RequestWithUser): Promise<Session> {
    return this.service.create(dto, req.user?.companyId);
  }

  @Get()
  findAll(
    @Query() query: PaginationQueryDto,
    @Req() req: RequestWithUser,
  ): Promise<PaginatedResponse<Session>> {
    return this.service.findAll(query, req.user?.companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: RequestWithUser): Promise<Session> {
    return this.service.findOne(id, req.user?.companyId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSessionDto,
    @Req() req: RequestWithUser,
  ): Promise<Session> {
    return this.service.update(id, dto, req.user?.companyId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: RequestWithUser): Promise<Session> {
    return this.service.remove(id, req.user?.companyId);
  }
}
