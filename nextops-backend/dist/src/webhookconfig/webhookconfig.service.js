"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WebhookConfigService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookConfigService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const paginate_1 = require("../common/pagination/paginate");
let WebhookConfigService = WebhookConfigService_1 = class WebhookConfigService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(WebhookConfigService_1.name);
    }
    async triggerWebhook(configId, payload) {
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
            }
            catch {
                this.logger.warn(`Webhook delivery attempt ${attempts} failed.`);
            }
        }
        if (!success) {
            throw new common_1.InternalServerErrorException(`Webhook Orchestrator Error: Не вдалося доставити вебхук після ${maxRetries} спроб.`);
        }
        return { success, attempts };
    }
    async create(dto) {
        const inputData = dto;
        return this.prisma.webhookConfig.create({
            data: inputData,
        });
    }
    async findAll(query) {
        return (0, paginate_1.paginate)(query, (skip, take) => this.prisma.webhookConfig.findMany({ skip, take }), () => this.prisma.webhookConfig.count());
    }
    async findOne(id) {
        const item = await this.prisma.webhookConfig.findUnique({ where: { id } });
        if (!item)
            throw new common_1.NotFoundException(`Конфігурацію вебхука з ID ${id} не знайдено`);
        return item;
    }
    async update(id, dto) {
        await this.findOne(id);
        const updateData = dto;
        return this.prisma.webhookConfig.update({
            where: { id },
            data: updateData,
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.webhookConfig.delete({ where: { id } });
    }
};
exports.WebhookConfigService = WebhookConfigService;
exports.WebhookConfigService = WebhookConfigService = WebhookConfigService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(prisma_service_1.PrismaService)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WebhookConfigService);
//# sourceMappingURL=webhookconfig.service.js.map