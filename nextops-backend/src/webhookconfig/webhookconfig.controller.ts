import { Controller, Get, Post, Body, Param, Delete, Patch, Inject } from '@nestjs/common';
import { WebhookConfigService } from './webhookconfig.service';
import { CreateWebhookConfigDto } from './dto/create-webhookconfig.dto';
import { UpdateWebhookConfigDto } from './dto/update-webhookconfig.dto';
import type { WebhookConfig } from '@prisma/client';

@Controller('webhookconfig')
export class WebhookConfigController {
  constructor(
    @Inject(WebhookConfigService)
    private readonly service: WebhookConfigService
  ) {}

  @Post()
  create(@Body() dto: CreateWebhookConfigDto): Promise<WebhookConfig> { 
    return this.service.create(dto); 
  }

  @Get()
  findAll(): Promise<WebhookConfig[]> { 
    return this.service.findAll(); 
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<WebhookConfig> { 
    return this.service.findOne(id); 
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWebhookConfigDto): Promise<WebhookConfig> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<WebhookConfig> { 
    return this.service.remove(id); 
  }
}
