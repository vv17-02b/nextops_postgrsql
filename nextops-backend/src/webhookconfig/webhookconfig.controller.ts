import { Controller, Get, Post, Body, Param, Delete, Patch, Inject, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { WebhookConfigService } from './webhookconfig.service';
import { CreateWebhookConfigDto } from './dto/create-webhookconfig.dto';
import { UpdateWebhookConfigDto } from './dto/update-webhookconfig.dto';
import type { WebhookConfig } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';
import { Roles } from '../auth/roles.decorator';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    companyId?: string;
  };
}

@Controller('webhookconfig')
@Roles('OWNER', 'ADMIN')
export class WebhookConfigController {
  constructor(
    @Inject(WebhookConfigService)
    private readonly service: WebhookConfigService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateWebhookConfigDto,
    @Req() req: RequestWithUser,
  ): Promise<WebhookConfig> {
    return this.service.create(dto, req.user?.companyId);
  }

  @Post(':id/trigger')
  trigger(
    @Param('id') id: string,
    @Body() payload: Record<string, unknown>,
    @Req() req: RequestWithUser,
  ): Promise<{ success: boolean; attempts: number }> {
    return this.service.triggerWebhook(id, payload ?? {}, req.user?.companyId);
  }

  @Get()
  findAll(
    @Query() query: PaginationQueryDto,
    @Req() req: RequestWithUser,
  ): Promise<PaginatedResponse<WebhookConfig>> {
    return this.service.findAll(query, req.user?.companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: RequestWithUser): Promise<WebhookConfig> {
    return this.service.findOne(id, req.user?.companyId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWebhookConfigDto,
    @Req() req: RequestWithUser,
  ): Promise<WebhookConfig> {
    return this.service.update(id, dto, req.user?.companyId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: RequestWithUser): Promise<WebhookConfig> {
    return this.service.remove(id, req.user?.companyId);
  }
}
