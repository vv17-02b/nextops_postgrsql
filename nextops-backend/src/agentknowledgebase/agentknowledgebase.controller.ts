import { Controller, Get, Post, Body, Param, Delete, Patch, Inject } from '@nestjs/common';
import { AgentKnowledgeBaseService } from './agentknowledgebase.service';
import { CreateAgentKnowledgeBaseDto } from './dto/create-agentknowledgebase.dto';
import { UpdateAgentKnowledgeBaseDto } from './dto/update-agentknowledgebase.dto';
import type { AgentKnowledgeBase } from '@prisma/client';

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
  findAll(): Promise<AgentKnowledgeBase[]> { 
    return this.service.findAll(); 
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
