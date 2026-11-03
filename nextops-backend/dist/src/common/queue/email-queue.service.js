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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailQueueService = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
let EmailQueueService = class EmailQueueService {
    constructor(queue) {
        this.queue = queue;
    }
    async enqueueInvitation(data) {
        if (!process.env.REDIS_URL || !this.queue) {
            throw new common_1.ServiceUnavailableException('Redis-backed email delivery is not configured.');
        }
        if (!process.env.SMTP_URL || !process.env.EMAIL_FROM) {
            throw new common_1.ServiceUnavailableException('SMTP_URL and EMAIL_FROM are required to deliver email jobs.');
        }
        await this.queue.add('invitation', data, {
            attempts: 5,
            backoff: { type: 'exponential', delay: 2_000 },
            removeOnComplete: 1_000,
            removeOnFail: 5_000,
        });
    }
};
exports.EmailQueueService = EmailQueueService;
exports.EmailQueueService = EmailQueueService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __param(0, (0, bullmq_1.InjectQueue)('email')),
    __metadata("design:paramtypes", [Function])
], EmailQueueService);
//# sourceMappingURL=email-queue.service.js.map