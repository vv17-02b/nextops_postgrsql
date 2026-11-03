import { Controller, Get, Post, Body, Param, Delete, Patch, Inject, Query } from '@nestjs/common';
import { AgentKnowledgeBaseService } from './agentknowledgebase.service';
import { CreateAgentKnowledgeBaseDto } from './dto/create-agentknowledgebase.dto';
import { UpdateAgentKnowledgeBaseDto } from './dto/update-agentknowledgebase.dto';
import type { AgentKnowledgeBase } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';

@Controller('agentknowledgebase')
export class AgentKnowledgeBaseController {
  constructor(
    @Inject(AgentKnowledgeBaseService)
    private readonly service: AgentKnowledgeBaseService
  ) {}

  @Post()
  create(@Body() dto: CreateAgentKnowledgeBaseDto): Promise<AgentKnowledgeBase> { 
    return this.service.create(dto); 
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto): Promise<PaginatedResponse<AgentKnowledgeBase>> {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<AgentKnowledgeBase> { 
    return this.service.findOne(id); 
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAgentKnowledgeBaseDto): Promise<AgentKnowledgeBase> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<AgentKnowledgeBase> { 
    return this.service.remove(id); 
  }
}
