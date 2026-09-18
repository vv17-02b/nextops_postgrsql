import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgentKnowledgeBaseDto } from './dto/create-agentknowledgebase.dto';
import { UpdateAgentKnowledgeBaseDto } from './dto/update-agentknowledgebase.dto';
import type { AgentKnowledgeBase } from '@prisma/client';

@Injectable()
export class AgentKnowledgeBaseService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService
  ) {}

  async create(dto: CreateAgentKnowledgeBaseDto): Promise<AgentKnowledgeBase> {
    return this.prisma.agentKnowledgeBase.create({ data: dto });
  }

  async findAll(): Promise<AgentKnowledgeBase[]> {
    return this.prisma.agentKnowledgeBase.findMany();
  }

  async findOne(id: string): Promise<AgentKnowledgeBase> {
    const item = await this.prisma.agentKnowledgeBase.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Документ бази знань з ID ${id} не знайдено`);
    return item;
  }

  async update(id: string, dto: UpdateAgentKnowledgeBaseDto): Promise<AgentKnowledgeBase> {
    await this.findOne(id);
    return this.prisma.agentKnowledgeBase.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string): Promise<AgentKnowledgeBase> {
    await this.findOne(id);
    return this.prisma.agentKnowledgeBase.delete({ where: { id } });
  }
}
