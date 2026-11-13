import { randomBytes } from 'node:crypto';
import { ForbiddenException, Injectable, NotFoundException, Inject, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateWebhookConfigDto } from './dto/create-webhookconfig.dto';
import { UpdateWebhookConfigDto } from './dto/update-webhookconfig.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { paginate, type PaginatedResponse } from '../common/pagination/paginate';
import { Prisma } from '@prisma/client';
import type { WebhookConfig } from '@prisma/client';
import { signWebhookPayload } from '../common/queue/webhook-queue.service';

@Injectable()
export class WebhookConfigService {
  private readonly logger = new Logger(WebhookConfigService.name);
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TenantContext)
    private readonly tenantContext: TenantContext,
  ) {}

  async triggerWebhook(
    configId: string,
    payload: Record<string, unknown>,
    companyId?: string,
  ): Promise<{ success: boolean; attempts: number }> {
    const config = await this.findOne(configId, companyId);

    if (!config.isActive) {
      return { success: false, attempts: 0 };
    }

    const maxRetries = 3;
    let attempts = 0;
    let success = false;

    const targetUrl = config.url;
    const eventName = config.events.length > 0 ? config.events[0] : 'ORDER_CREATED';

    while (attempts < maxRetries && !success) {
      attempts++;
      try {
        const rawBody = JSON.stringify({
          event: eventName,
          projectId: config.projectId,
          timestamp: new Date().toISOString(),
          data: Object.keys(payload).length > 0 ? payload : { status: 'completed', test: true },
        });

        const response = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-NextOps-Event': eventName,
            'X-NextOps-Signature': signWebhookPayload(rawBody, config.secret),
          },
          body: rawBody,
          signal: AbortSignal.timeout(10_000),
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

  async create(dto: CreateWebhookConfigDto, companyId?: string): Promise<WebhookConfig> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (!activeCompanyId) throw new ForbiddenException('A business workspace is required.');

    const inputData: Prisma.WebhookConfigUncheckedCreateInput = {
      projectId: dto.projectId,
      url: dto.url,
      secret: dto.secret?.trim() || `whsec_${randomBytes(24).toString('hex')}`,
      events: dto.events,
      isActive: dto.isActive ?? true,
      companyId: activeCompanyId,
    };

    return this.prisma.webhookConfig.create({
      data: inputData,
    });
  }

  async findAll(
    query: PaginationQueryDto,
    companyId?: string,
  ): Promise<PaginatedResponse<WebhookConfig>> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    const where = activeCompanyId ? { companyId: activeCompanyId } : {};

    return paginate(
      query,
      (skip, take) => this.prisma.webhookConfig.findMany({ where, skip, take }),
      () => this.prisma.webhookConfig.count({ where }),
    );
  }

  async findOne(id: string, companyId?: string): Promise<WebhookConfig> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    const item = await this.prisma.webhookConfig.findFirst({
      where: activeCompanyId ? { id, companyId: activeCompanyId } : { id },
    });
    if (!item) throw new NotFoundException(`Конфігурацію вебхука з ID ${id} не знайдено`);
    return item;
  }

  async update(
    id: string,
    dto: UpdateWebhookConfigDto,
    companyId?: string,
  ): Promise<WebhookConfig> {
    await this.findOne(id, companyId);
    const updateData: Prisma.WebhookConfigUncheckedUpdateInput = {
      ...(dto.projectId !== undefined ? { projectId: dto.projectId } : {}),
      ...(dto.url !== undefined ? { url: dto.url } : {}),
      ...(dto.secret !== undefined ? { secret: dto.secret } : {}),
      ...(dto.events !== undefined ? { events: dto.events } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    };

    return this.prisma.webhookConfig.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, companyId?: string): Promise<WebhookConfig> {
    await this.findOne(id, companyId);
    return this.prisma.webhookConfig.delete({ where: { id } });
  }
}
