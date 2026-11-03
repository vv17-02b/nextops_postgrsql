import { AgentKnowledgeBaseService } from './agentknowledgebase.service';
import { CreateAgentKnowledgeBaseDto } from './dto/create-agentknowledgebase.dto';
import { UpdateAgentKnowledgeBaseDto } from './dto/update-agentknowledgebase.dto';
import type { AgentKnowledgeBase } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';
export declare class AgentKnowledgeBaseController {
    private readonly service;
    constructor(service: AgentKnowledgeBaseService);
    create(dto: CreateAgentKnowledgeBaseDto): Promise<AgentKnowledgeBase>;
    findAll(query: PaginationQueryDto): Promise<PaginatedResponse<AgentKnowledgeBase>>;
    findOne(id: string): Promise<AgentKnowledgeBase>;
    update(id: string, dto: UpdateAgentKnowledgeBaseDto): Promise<AgentKnowledgeBase>;
    remove(id: string): Promise<AgentKnowledgeBase>;
}
