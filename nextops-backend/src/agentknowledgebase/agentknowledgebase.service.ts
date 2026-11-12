import { BadRequestException, Injectable, NotFoundException, Inject, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { AuditService } from '../audit/audit.service';
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

  async executeAiTask(userId: string, estimatedCostMinor: number, taskPayload: string): Promise<{ success: boolean; aiResponse: string }> {
    if (!Number.isSafeInteger(estimatedCostMinor) || estimatedCostMinor <= 0) {
      throw new BadRequestException('Estimated cost must be a positive integer number of minor units.');
    }

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

  async create(dto: CreateAgentKnowledgeBaseDto, companyId?: string): Promise<AgentKnowledgeBase> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (!activeCompanyId) throw new ForbiddenException('A business workspace is required.');
    return this.prisma.agentKnowledgeBase.create({ data: { ...dto, companyId: activeCompanyId } });
  }

  async findAll(
    query: PaginationQueryDto,
    companyId?: string,
  ): Promise<PaginatedResponse<AgentKnowledgeBase>> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    const where = activeCompanyId ? { companyId: activeCompanyId } : {};

    return paginate(
      query,
      (skip, take) => this.prisma.agentKnowledgeBase.findMany({ where, skip, take }),
      () => this.prisma.agentKnowledgeBase.count({ where }),
    );
  }

  async findOne(id: string, companyId?: string): Promise<AgentKnowledgeBase> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    const item = await this.prisma.agentKnowledgeBase.findFirst({
      where: activeCompanyId ? { id, companyId: activeCompanyId } : { id },
    });
    if (!item) throw new NotFoundException(`Документ бази знань з ID ${id} не знайдено`);
    return item;
  }

  async update(
    id: string,
    dto: UpdateAgentKnowledgeBaseDto,
    companyId?: string,
  ): Promise<AgentKnowledgeBase> {
    await this.findOne(id, companyId);
    return this.prisma.agentKnowledgeBase.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, companyId?: string): Promise<AgentKnowledgeBase> {
    await this.findOne(id, companyId);
    return this.prisma.agentKnowledgeBase.delete({ where: { id } });
  }
}
