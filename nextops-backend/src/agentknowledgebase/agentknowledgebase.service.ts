import { BadRequestException, Injectable, NotFoundException, Inject, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateAgentKnowledgeBaseDto } from './dto/create-agentknowledgebase.dto';
import { UpdateAgentKnowledgeBaseDto } from './dto/update-agentknowledgebase.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { paginate, type PaginatedResponse } from '../common/pagination/paginate';
import type { AgentKnowledgeBase } from '@prisma/client';

@Injectable()
export class AgentKnowledgeBaseService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TenantContext) private readonly tenantContext: TenantContext,
  ) {}

  // 1. Метод виконання ШІ-завдань із вбудованим FinOps-контролем бюджету
  // estimatedCostMinor — вартість у цілих копійках (minor units).
  async executeAiTask(userId: string, estimatedCostMinor: number, taskPayload: string): Promise<{ success: boolean; aiResponse: string }> {
    if (!Number.isSafeInteger(estimatedCostMinor) || estimatedCostMinor <= 0) {
      throw new BadRequestException('Estimated cost must be a positive integer number of minor units.');
    }

    // А. Шукаємо бюджет користувача через findFirst (оскільки userId не унікальний індекс на рівні Prisma)
    const budget = await this.prisma.userAiBudget.findFirst({
      where: { userId },
    });

    if (!budget) {
      throw new NotFoundException(`FinOps Error: Для користувача з ID ${userId} не знайдено активного ШІ-гаманця`);
    }

    const charged = await this.prisma.userAiBudget.updateMany({
      where: {
        id: budget.id,
        currentUsageMinor: { lte: budget.monthlyLimitMinor - estimatedCostMinor },
      },
      data: {
        currentUsageMinor: { increment: estimatedCostMinor },
      },
    });

    if (charged.count !== 1) {
      throw new ForbiddenException('The AI budget limit has been reached.');
    }

    const mockAiResponse = `Processed task: "${taskPayload}". AI tokens validated by NextOps engine core.`;
    return {
      success: true,
      aiResponse: mockAiResponse,
    };
  }

  // 2. Стандартні системні CRUD методи модуля
  async create(dto: CreateAgentKnowledgeBaseDto): Promise<AgentKnowledgeBase> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) throw new ForbiddenException('A business workspace is required.');
    return this.prisma.agentKnowledgeBase.create({ data: { ...dto, companyId } });
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<AgentKnowledgeBase>> {
    return paginate(
      query,
      (skip, take) => this.prisma.agentKnowledgeBase.findMany({ skip, take }),
      () => this.prisma.agentKnowledgeBase.count(),
    );
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
