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
var IdempotencyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdempotencyService = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const redis_1 = require("redis");
const COMPLETE_RESULT_SCRIPT = `
  if redis.call('GET', KEYS[1]) == ARGV[1] then
    redis.call('SET', KEYS[1], ARGV[2], 'PX', ARGV[3])
    return 1
  end
  return 0
`;
const DELETE_LOCK_SCRIPT = `
  if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
  end
  return 0
`;
let IdempotencyService = IdempotencyService_1 = class IdempotencyService {
    constructor() {
        this.logger = new common_1.Logger(IdempotencyService_1.name);
        this.client = process.env.REDIS_URL
            ? (0, redis_1.createClient)({ url: process.env.REDIS_URL })
            : null;
        this.client?.on('error', (error) => {
            this.logger.error('Redis connection error', error.message);
        });
    }
    async onModuleInit() {
        if (this.client && !this.client.isOpen) {
            await this.client.connect();
        }
    }
    async onModuleDestroy() {
        if (this.client?.isOpen) {
            await this.client.quit();
        }
    }
    async execute(scope, key, request, action) {
        if (!/^[\w.-]{8,200}$/.test(key)) {
            throw new common_1.BadRequestException({
                message: 'A valid Idempotency-Key header is required.',
                errorCode: 'INVALID_IDEMPOTENCY_KEY',
            });
        }
        if (!this.client?.isReady) {
            throw new common_1.ServiceUnavailableException({
                message: 'The idempotency service is unavailable.',
                errorCode: 'IDEMPOTENCY_UNAVAILABLE',
            });
        }
        const requestHash = (0, node_crypto_1.createHash)('sha256')
            .update(JSON.stringify(request))
            .digest('hex');
        const redisKey = `nextops:idempotency:${scope}:${key}`;
        const existing = await this.client.get(redisKey);
        if (existing) {
            return this.readCachedResult(this.toText(existing), requestHash);
        }
        const lockValue = `processing:${requestHash}`;
        const lockAcquired = await this.client.set(redisKey, lockValue, {
            NX: true,
            PX: 5 * 60 * 1000,
        });
        if (lockAcquired !== 'OK') {
            const current = await this.client.get(redisKey);
            if (current && current !== lockValue) {
                return this.readCachedResult(this.toText(current), requestHash);
            }
            throw new common_1.ConflictException({
                message: 'A request with this idempotency key is already in progress.',
                errorCode: 'IDEMPOTENCY_IN_PROGRESS',
            });
        }
        try {
            const result = await action();
            const cached = {
                state: 'complete',
                requestHash,
                response: result,
            };
            const saved = await this.client.eval(COMPLETE_RESULT_SCRIPT, {
                keys: [redisKey],
                arguments: [lockValue, JSON.stringify(cached), String(24 * 60 * 60 * 1000)],
            });
            if (saved !== 1) {
                throw new common_1.ServiceUnavailableException({
                    message: 'The idempotency result could not be safely stored.',
                    errorCode: 'IDEMPOTENCY_RESULT_NOT_STORED',
                });
            }
            return result;
        }
        catch (error) {
            await this.client.eval(DELETE_LOCK_SCRIPT, {
                keys: [redisKey],
                arguments: [lockValue],
            });
            throw error;
        }
    }
    readCachedResult(value, requestHash) {
        if (value.startsWith('processing:')) {
            if (value !== `processing:${requestHash}`) {
                throw new common_1.ConflictException({
                    message: 'This idempotency key is already in use for another request.',
                    errorCode: 'IDEMPOTENCY_KEY_REUSED',
                });
            }
            throw new common_1.ConflictException({
                message: 'A request with this idempotency key is already in progress.',
                errorCode: 'IDEMPOTENCY_IN_PROGRESS',
            });
        }
        const result = JSON.parse(value);
        if (result.state !== 'complete' || result.requestHash !== requestHash) {
            throw new common_1.ConflictException({
                message: 'This idempotency key is already in use for another request.',
                errorCode: 'IDEMPOTENCY_KEY_REUSED',
            });
        }
        return result.response;
    }
    toText(value) {
        return typeof value === 'string' ? value : value.toString('utf8');
    }
};
exports.IdempotencyService = IdempotencyService;
exports.IdempotencyService = IdempotencyService = IdempotencyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], IdempotencyService);
//# sourceMappingURL=idempotency.service.js.map