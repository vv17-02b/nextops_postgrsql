"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TokenRevocationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenRevocationService = void 0;
const common_1 = require("@nestjs/common");
const redis_1 = require("redis");
const node_crypto_1 = require("node:crypto");
const cookie_session_1 = require("./cookie-session");
const REVOCATION_PREFIX = 'nextops:jwt-revoked:';
const SESSION_INDEX_PREFIX = 'nextops:jwt-sessions:';
let TokenRevocationService = TokenRevocationService_1 = class TokenRevocationService {
    constructor() {
        this.client = process.env.REDIS_URL
            ? (0, redis_1.createClient)({ url: process.env.REDIS_URL })
            : null;
    }
    async onModuleInit() {
        if (this.client && !this.client.isOpen) {
            await this.client.connect().catch(() => undefined);
        }
    }
    async onModuleDestroy() {
        if (this.client?.isOpen) {
            await this.client.quit().catch(() => undefined);
        }
    }
    static tokenFingerprint(token) {
        return (0, node_crypto_1.createHash)('sha256').update(token).digest('hex');
    }
    async revokeToken(token, expiresAtMs) {
        if (!this.client?.isReady)
            return;
        const ttl = expiresAtMs - Date.now();
        if (ttl <= 0)
            return;
        await this.client
            .set(REVOCATION_PREFIX + TokenRevocationService_1.tokenFingerprint(token), '1', { PX: ttl })
            .catch(() => undefined);
    }
    async isTokenRevoked(token) {
        if (!this.client?.isReady)
            return false;
        const revoked = await this.client
            .get(REVOCATION_PREFIX + TokenRevocationService_1.tokenFingerprint(token))
            .catch(() => null);
        return revoked === '1';
    }
    async bumpSessionEpoch(userId) {
        if (!this.client?.isReady)
            return 0;
        const epoch = await this.client.incr(SESSION_INDEX_PREFIX + userId);
        return epoch;
    }
    async getSessionEpoch(userId) {
        if (!this.client?.isReady)
            return 0;
        const epoch = await this.client.get(SESSION_INDEX_PREFIX + userId).catch(() => null);
        return epoch ? Number(epoch) : 0;
    }
    static extractToken(request) {
        const authHeader = request.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            return authHeader.slice('Bearer '.length);
        }
        return (0, cookie_session_1.readCookie)(request, cookie_session_1.SESSION_COOKIE);
    }
};
exports.TokenRevocationService = TokenRevocationService;
exports.TokenRevocationService = TokenRevocationService = TokenRevocationService_1 = __decorate([
    (0, common_1.Injectable)()
], TokenRevocationService);
//# sourceMappingURL=token-revocation.service.js.map