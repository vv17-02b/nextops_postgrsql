import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateAgentKnowledgeBaseDto } from './dto/create-agentknowledgebase.dto';
import { UpdateAgentKnowledgeBaseDto } from './dto/update-agentknowledgebase.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { type PaginatedResponse } from '../common/pagination/paginate';
import type { AgentKnowledgeBase } from '@prisma/client';
export declare class AgentKnowledgeBaseService {
    private readonly prisma;
    private readonly tenantContext;
    constructor(prisma: PrismaService, tenantContext: TenantContext);
    executeAiTask(userId: string, estimatedCostMinor: number, taskPayload: string): Promise<{
        success: boolean;
        aiResponse: string;
    }>;
    create(dto: CreateAgentKnowledgeBaseDto): Promise<AgentKnowledgeBase>;
    findAll(query: PaginationQueryDto): Promise<PaginatedResponse<AgentKnowledgeBase>>;
    findOne(id: string): Promise<AgentKnowledgeBase>;
    update(id: string, dto: UpdateAgentKnowledgeBaseDto): Promise<AgentKnowledgeBase>;
    remove(id: string): Promise<AgentKnowledgeBase>;
}
