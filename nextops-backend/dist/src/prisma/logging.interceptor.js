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
var LoggingInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const prisma_service_1 = require("./prisma.service");
let LoggingInterceptor = LoggingInterceptor_1 = class LoggingInterceptor {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(LoggingInterceptor_1.name);
    }
    intercept(context, next) {
        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest();
        const response = httpContext.getResponse();
        const method = request.method;
        const endpoint = request.path;
        const startTime = performance.now();
        const userId = request.user?.id;
        if (endpoint.includes('/api/apihistory') || endpoint.includes('/apihistory')) {
            return next.handle();
        }
        if (!userId) {
            return next.handle();
        }
        return next.handle().pipe((0, operators_1.tap)({
            next: () => {
                const endTime = performance.now();
                const durationMs = Math.round(endTime - startTime);
                const statusCode = response.statusCode;
                void this.prisma.apiHistory.create({
                    data: {
                        endpoint: endpoint || '/unknown',
                        method: method || 'GET',
                        statusCode: statusCode || 200,
                        durationMs: durationMs || 0,
                        ...(userId ? { userId } : {}),
                    },
                }).catch((error) => {
                    this.logger.error('Failed to persist API request history.', error instanceof Error ? error.stack : undefined);
                });
            },
            error: (error) => {
                const endTime = performance.now();
                const durationMs = Math.round(endTime - startTime);
                const statusCode = typeof error === 'object' &&
                    error !== null &&
                    'status' in error &&
                    typeof error.status === 'number'
                    ? error.status
                    : 500;
                void this.prisma.apiHistory.create({
                    data: {
                        endpoint: endpoint || '/unknown',
                        method: method || 'GET',
                        statusCode,
                        durationMs,
                        ...(userId ? { userId } : {}),
                    },
                }).catch((dbErr) => {
                    this.logger.error('Failed to persist API request history after request error.', dbErr instanceof Error ? dbErr.stack : undefined);
                });
            }
        }));
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = LoggingInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(prisma_service_1.PrismaService)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map