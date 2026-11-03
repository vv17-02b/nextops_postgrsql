import { WebhookConfigService } from './webhookconfig.service';
import { CreateWebhookConfigDto } from './dto/create-webhookconfig.dto';
import { UpdateWebhookConfigDto } from './dto/update-webhookconfig.dto';
import type { WebhookConfig } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';
export declare class WebhookConfigController {
    private readonly service;
    constructor(service: WebhookConfigService);
    create(dto: CreateWebhookConfigDto): Promise<WebhookConfig>;
    findAll(query: PaginationQueryDto): Promise<PaginatedResponse<WebhookConfig>>;
    findOne(id: string): Promise<WebhookConfig>;
    update(id: string, dto: UpdateWebhookConfigDto): Promise<WebhookConfig>;
    remove(id: string): Promise<WebhookConfig>;
}
