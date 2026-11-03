"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueModule = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const email_queue_processor_1 = require("./email-queue.processor");
const email_queue_service_1 = require("./email-queue.service");
function redisConnection() {
    const url = new URL(process.env.REDIS_URL ?? 'redis://127.0.0.1:6379');
    return {
        host: url.hostname,
        port: url.port ? Number(url.port) : url.protocol === 'rediss:' ? 6380 : 6379,
        ...(url.username ? { username: decodeURIComponent(url.username) } : {}),
        ...(url.password ? { password: decodeURIComponent(url.password) } : {}),
        ...(url.pathname.length > 1 ? { db: Number(url.pathname.slice(1)) } : {}),
        ...(url.protocol === 'rediss:' ? { tls: {} } : {}),
        maxRetriesPerRequest: null,
    };
}
const queueEnabled = Boolean(process.env.REDIS_URL);
const queueImports = queueEnabled
    ? [
        bullmq_1.BullModule.forRoot({ connection: redisConnection() }),
        bullmq_1.BullModule.registerQueue({ name: 'email' }),
    ]
    : [];
let QueueModule = class QueueModule {
};
exports.QueueModule = QueueModule;
exports.QueueModule = QueueModule = __decorate([
    (0, common_1.Module)({
        imports: queueImports,
        providers: queueEnabled
            ? [email_queue_service_1.EmailQueueService, email_queue_processor_1.EmailQueueProcessor]
            : [email_queue_service_1.EmailQueueService],
        exports: [email_queue_service_1.EmailQueueService],
    })
], QueueModule);
//# sourceMappingURL=queue.module.js.map