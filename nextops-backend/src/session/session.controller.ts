import { Controller, Get, Post, Body, Param, Delete, Patch, Inject, Query } from '@nestjs/common';
import { SessionService } from './session.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import type { Session } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';

@Controller('session')
export class SessionController {
  constructor(
    @Inject(SessionService)
    private readonly service: SessionService
  ) {}

  @Post()
  create(@Body() dto: CreateSessionDto): Promise<Session> { 
    return this.service.create(dto); 
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto): Promise<PaginatedResponse<Session>> {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Session> { 
    return this.service.findOne(id); 
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSessionDto): Promise<Session> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<Session> { 
    return this.service.remove(id); 
  }
}
