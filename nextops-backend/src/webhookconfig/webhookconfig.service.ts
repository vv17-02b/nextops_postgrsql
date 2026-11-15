import { randomBytes } from 'node:crypto';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateWebhookConfigDto } from './dto/create-webhookconfig.dto';
import { UpdateWebhookConfigDto } from './dto/update-webhookconfig.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { paginate, type PaginatedResponse } from '../common/pagination/paginate';
import { Prisma } from '@prisma/client';
import type { WebhookConfig } from '@prisma/client';
import { deliverWebhookHttp } from '../common/queue/webhook-queue.service';
import { assertSafeWebhookUrl } from './webhook-url.validator';

function maskWebhookSecret(secret: string): string {
  if (secret.length <= 10) return '••••••••';
  return `${secret.slice(0, 6)}••••••${secret.slice(-4)}`;
}

function sanitizeConfig(config: WebhookConfig): WebhookConfig {
  return {
    ...config,
    secret: maskWebhookSecret(config.secret),
  };
}

@Injectable()
export class WebhookConfigService {
  private readonly logger = new Logger(WebhookConfigService.name);

  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TenantContext)
    private readonly tenantContext: TenantContext,
  ) {}

  private async findRawOne(id: string, companyId?: string): Promise<WebhookConfig> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    const item = await this.prisma.webhookConfig.findFirst({
      where: activeCompanyId ? { id, companyId: activeCompanyId } : { id },
    });
    if (!item) {
      throw new NotFoundException(`Конфігурацію вебхука з ID ${id} не знайдено`);
    }
    return item;
  }

  async triggerWebhook(
    configId: string,
    payload: Record<string, unknown>,
    companyId?: string,
  ): Promise<{ success: boolean; attempts: number }> {
    const config = await this.findRawOne(configId, companyId);

    if (!config.isActive) {
      return { success: false, attempts: 0 };
    }

    const maxRetries = 3;
    let attempts = 0;
    let success = false;
    const eventName = config.events.length > 0 ? config.events[0] : 'ORDER_CREATED';

    while (attempts < maxRetries && !success) {
      attempts++;
      try {
        await deliverWebhookHttp({
          configId: config.id,
          companyId: config.companyId,
          url: config.url,
          secret: config.secret,
          event: eventName,
          payload:
            Object.keys(payload).length > 0
              ? payload
              : { projectId: config.projectId, status: 'completed', test: true },
        });
        success = true;
      } catch {
        this.logger.warn(`Webhook delivery attempt ${attempts} failed for config ${config.id}.`);
        if (attempts < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, attempts * 300));
        }
      }
    }

    if (!success) {
      throw new InternalServerErrorException(
        `Webhook Orchestrator Error: Не вдалося доставити вебхук після ${maxRetries} спроб.`,
      );
    }

    return { success, attempts };
  }

  async create(dto: CreateWebhookConfigDto, companyId?: string): Promise<WebhookConfig> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (!activeCompanyId) throw new ForbiddenException('A business workspace is required.');

    const safeUrl = assertSafeWebhookUrl(dto.url);

    const inputData: Prisma.WebhookConfigUncheckedCreateInput = {
      projectId: dto.projectId,
      url: safeUrl,
      secret: dto.secret?.trim() || `whsec_${randomBytes(24).toString('hex')}`,
      events: dto.events,
      isActive: dto.isActive ?? true,
      companyId: activeCompanyId,
    };

    // Повертаємо повний secret один раз під час створення
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
      async (skip, take) => {
        const items = await this.prisma.webhookConfig.findMany({ where, skip, take });
        return items.map(sanitizeConfig);
      },
      () => this.prisma.webhookConfig.count({ where }),
    );
  }

  async findOne(id: string, companyId?: string): Promise<WebhookConfig> {
    const item = await this.findRawOne(id, companyId);
    return sanitizeConfig(item);
  }

  async update(
    id: string,
    dto: UpdateWebhookConfigDto,
    companyId?: string,
  ): Promise<WebhookConfig> {
    await this.findRawOne(id, companyId);
    const safeUrl = dto.url !== undefined ? assertSafeWebhookUrl(dto.url) : undefined;

    const updateData: Prisma.WebhookConfigUncheckedUpdateInput = {
      ...(dto.projectId !== undefined ? { projectId: dto.projectId } : {}),
      ...(safeUrl !== undefined ? { url: safeUrl } : {}),
      ...(dto.secret !== undefined ? { secret: dto.secret } : {}),
      ...(dto.events !== undefined ? { events: dto.events } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    };

    const updated = await this.prisma.webhookConfig.update({
      where: { id },
      data: updateData,
    });
    return sanitizeConfig(updated);
  }

  async remove(id: string, companyId?: string): Promise<WebhookConfig> {
    await this.findRawOne(id, companyId);
    const deleted = await this.prisma.webhookConfig.delete({ where: { id } });
    return sanitizeConfig(deleted);
  }
}
