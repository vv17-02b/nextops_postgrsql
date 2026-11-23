import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AgentKnowledgeBase } from '@prisma/client';
import {
  AgentKnowledgeBaseService,
  type AskAssistantResponse,
} from './agentknowledgebase.service';
import { CreateAgentKnowledgeBaseDto } from './dto/create-agentknowledgebase.dto';
import { UpdateAgentKnowledgeBaseDto } from './dto/update-agentknowledgebase.dto';
import { AskKnowledgeBaseDto } from './dto/ask-knowledge-base.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';
import { RateLimit } from '../auth/rate-limit.guard';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    companyId?: string;
  };
}

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const WRITE_ALLOWED_ROLES = new Set(['OWNER', 'ADMIN', 'MANAGER', 'SUPERADMIN']);

@Controller('agentknowledgebase')
export class AgentKnowledgeBaseController {
  constructor(
    @Inject(AgentKnowledgeBaseService)
    private readonly service: AgentKnowledgeBaseService,
  ) {}

  private assertWritePermission(role?: string): void {
    if (!role || !WRITE_ALLOWED_ROLES.has(role.toUpperCase())) {
      throw new ForbiddenException(
        'Недостатньо прав для зміни бази знань. Потрібна роль OWNER, ADMIN або MANAGER.',
      );
    }
  }

  @Post('ask')
  @RateLimit(30, 60)
  ask(
    @Body() dto: AskKnowledgeBaseDto,
    @Req() req: RequestWithUser,
  ): Promise<AskAssistantResponse> {
    return this.service.askAssistant(dto.question, {
      companyId: req.user?.companyId,
      userId: req.user?.id,
      userRole: req.user?.role,
      projectId: dto.projectId,
    });
  }

  @Post()
  create(
    @Body() dto: CreateAgentKnowledgeBaseDto,
    @Req() req: RequestWithUser,
  ): Promise<AgentKnowledgeBase> {
    this.assertWritePermission(req.user?.role);
    return this.service.create(dto, req.user?.companyId);
  }

  @Get()
  findAll(
    @Query() query: PaginationQueryDto,
    @Query('projectId') projectId: string | undefined,
    @Req() req: RequestWithUser,
  ): Promise<PaginatedResponse<AgentKnowledgeBase>> {
    if (projectId !== undefined && projectId !== '' && !UUID_V4_REGEX.test(projectId)) {
      throw new BadRequestException('Некоректний формат query-параметра projectId');
    }
    return this.service.findAll(query, req.user?.companyId, projectId || undefined);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ): Promise<AgentKnowledgeBase> {
    return this.service.findOne(id, req.user?.companyId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAgentKnowledgeBaseDto,
    @Req() req: RequestWithUser,
  ): Promise<AgentKnowledgeBase> {
    this.assertWritePermission(req.user?.role);
    return this.service.update(id, dto, req.user?.companyId);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ): Promise<AgentKnowledgeBase> {
    this.assertWritePermission(req.user?.role);
    return this.service.remove(id, req.user?.companyId);
  }
}
