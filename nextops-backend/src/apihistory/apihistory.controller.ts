import { Controller, Get, Post, Body, Param, Delete, Patch, Inject } from '@nestjs/common';
import { ApiHistoryService } from './apihistory.service';
import { CreateApiHistoryDto } from './dto/create-apihistory.dto';
import { UpdateApiHistoryDto } from './dto/update-apihistory.dto';
import type { ApiHistory } from '@prisma/client';

@Controller('apihistory')
export class ApiHistoryController {
  constructor(
    @Inject(ApiHistoryService)
    private readonly service: ApiHistoryService
  ) {}

  @Post()
  create(@Body() dto: CreateApiHistoryDto): Promise<ApiHistory> { 
    return this.service.create(dto); 
  }

  @Get()
  findAll(): Promise<ApiHistory[]> { 
    return this.service.findAll(); 
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
