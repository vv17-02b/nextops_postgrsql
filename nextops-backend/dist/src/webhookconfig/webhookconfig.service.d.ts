import { PrismaService } from '../prisma/prisma.service';
import { CreateWebhookConfigDto } from './dto/create-webhookconfig.dto';
import { UpdateWebhookConfigDto } from './dto/update-webhookconfig.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { type PaginatedResponse } from '../common/pagination/paginate';
import type { WebhookConfig } from '@prisma/client';
export declare class WebhookConfigService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    triggerWebhook(configId: string, payload: Record<string, unknown>): Promise<{
        success: boolean;
        attempts: number;
    }>;
    create(dto: CreateWebhookConfigDto): Promise<WebhookConfig>;
    findAll(query: PaginationQueryDto): Promise<PaginatedResponse<WebhookConfig>>;
    findOne(id: string): Promise<WebhookConfig>;
    update(id: string, dto: UpdateWebhookConfigDto): Promise<WebhookConfig>;
    remove(id: string): Promise<WebhookConfig>;
}
