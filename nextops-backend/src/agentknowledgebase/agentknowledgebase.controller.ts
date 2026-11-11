import { Controller, Get, Post, Body, Param, Delete, Patch, Inject, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AgentKnowledgeBaseService } from './agentknowledgebase.service';
import { CreateAgentKnowledgeBaseDto } from './dto/create-agentknowledgebase.dto';
import { UpdateAgentKnowledgeBaseDto } from './dto/update-agentknowledgebase.dto';
import type { AgentKnowledgeBase } from '@prisma/client';
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

@Controller('agentknowledgebase')
export class AgentKnowledgeBaseController {
  constructor(
    @Inject(AgentKnowledgeBaseService)
    private readonly service: AgentKnowledgeBaseService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateAgentKnowledgeBaseDto,
    @Req() req: RequestWithUser,
  ): Promise<AgentKnowledgeBase> {
    return this.service.create(dto, req.user?.companyId);
  }

  @Get()
  findAll(
    @Query() query: PaginationQueryDto,
    @Req() req: RequestWithUser,
  ): Promise<PaginatedResponse<AgentKnowledgeBase>> {
    return this.service.findAll(query, req.user?.companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: RequestWithUser): Promise<AgentKnowledgeBase> {
    return this.service.findOne(id, req.user?.companyId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAgentKnowledgeBaseDto,
    @Req() req: RequestWithUser,
  ): Promise<AgentKnowledgeBase> {
    return this.service.update(id, dto, req.user?.companyId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: RequestWithUser): Promise<AgentKnowledgeBase> {
    return this.service.remove(id, req.user?.companyId);
  }
}
