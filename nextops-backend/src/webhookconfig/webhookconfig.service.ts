import { Injectable, NotFoundException, Inject, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWebhookConfigDto } from './dto/create-webhookconfig.dto';
import { UpdateWebhookConfigDto } from './dto/update-webhookconfig.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { paginate, type PaginatedResponse } from '../common/pagination/paginate';
import { Prisma } from '@prisma/client';
import type { WebhookConfig } from '@prisma/client';

@Injectable()
export class WebhookConfigService {
  private readonly logger = new Logger(WebhookConfigService.name);
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService
  ) {}


  async triggerWebhook(configId: string, payload: Record<string, unknown>): Promise<{ success: boolean; attempts: number }> {
    const config = await this.findOne(configId);
    
  
    if (!config.isActive) {
      return { success: false, attempts: 0 };
    }

    const maxRetries = 3;
    let attempts = 0;
    let success = false;

    const targetUrl = config.url || 'http://localhost:3000/fallback-webhook';
    
    const eventName = config.events.length > 0 ? config.events[0] : 'ai.task.completed';

    while (attempts < maxRetries && !success) {
      attempts++;
      try {
        const response = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-NextOps-Signature': config.secret || 'sha256-mock-secure-signature-key',
          },
          body: JSON.stringify({ event: eventName, data: payload }),
        });

        if (response.ok) {
          success = true;
        }
      } catch {
        this.logger.warn(`Webhook delivery attempt ${attempts} failed.`);
      }
    }

    if (!success) {
      throw new InternalServerErrorException(`Webhook Orchestrator Error: Не вдалося доставити вебхук після ${maxRetries} спроб.`);
    }

    return { success, attempts };
  }

  // 2. Системні CRUD методи з використанням нативного типу Prisma інпуту
  async create(dto: CreateWebhookConfigDto): Promise<WebhookConfig> {
    const inputData = dto as Prisma.WebhookConfigUncheckedCreateInput;
    return this.prisma.webhookConfig.create({ 
      data: inputData,
    });
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<WebhookConfig>> {
    return paginate(
      query,
      (skip, take) => this.prisma.webhookConfig.findMany({ skip, take }),
      () => this.prisma.webhookConfig.count(),
    );
  }

  async findOne(id: string): Promise<WebhookConfig> {
    const item = await this.prisma.webhookConfig.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Конфігурацію вебхука з ID ${id} не знайдено`);
    return item;
  }

  async update(id: string, dto: UpdateWebhookConfigDto): Promise<WebhookConfig> {
    await this.findOne(id);
    const updateData = dto as Prisma.WebhookConfigUncheckedUpdateInput;
    
    return this.prisma.webhookConfig.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string): Promise<WebhookConfig> {
    await this.findOne(id);
    return this.prisma.webhookConfig.delete({ where: { id } });
  }
}
