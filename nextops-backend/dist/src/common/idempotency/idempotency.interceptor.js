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
var IdempotencyInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdempotencyInterceptor = exports.Idempotent = exports.IDEMPOTENT_KEY = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const core_1 = require("@nestjs/core");
const idempotency_service_1 = require("./idempotency.service");
exports.IDEMPOTENT_KEY = 'nextops:idempotent';
const Idempotent = () => ((_target, _propertyKey, descriptor) => {
    Reflect.defineMetadata(exports.IDEMPOTENT_KEY, true, descriptor.value);
    return descriptor;
});
exports.Idempotent = Idempotent;
let IdempotencyInterceptor = IdempotencyInterceptor_1 = class IdempotencyInterceptor {
    constructor(idempotency, reflector) {
        this.idempotency = idempotency;
        this.reflector = reflector;
    }
    static resolveBody(value) {
        return typeof value === 'object' && value !== null ? value : {};
    }
    intercept(context, next) {
        const isIdempotent = this.reflector.get(exports.IDEMPOTENT_KEY, context.getHandler());
        const request = context.switchToHttp().getRequest();
        const idempotencyKey = request.headers['idempotency-key'];
        const firstValue = Array.isArray(idempotencyKey) && idempotencyKey.length > 0
            ? idempotencyKey[0]
            : idempotencyKey;
        if (!isIdempotent || typeof firstValue !== 'string') {
            return next.handle();
        }
        const scope = `${request.method ?? 'MUTATION'}:${request.user?.id ?? 'anon'}`;
        const body = IdempotencyInterceptor_1.resolveBody(request.body);
        return new rxjs_1.Observable((subscriber) => {
            this.idempotency
                .execute(scope, firstValue, body, () => {
                return new Promise((resolve, reject) => {
                    next.handle().subscribe({
                        next: (value) => resolve(value),
                        error: (error) => reject(error instanceof Error ? error : new Error(String(error))),
                    });
                });
            })
                .then((result) => subscriber.next(result))
                .catch((error) => {
                if (error instanceof common_1.NotFoundException || error instanceof Error) {
                    subscriber.error(error);
                }
                else {
                    subscriber.error(new Error(String(error)));
                }
            })
                .finally(() => subscriber.complete());
        });
    }
};
exports.IdempotencyInterceptor = IdempotencyInterceptor;
exports.IdempotencyInterceptor = IdempotencyInterceptor = IdempotencyInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [idempotency_service_1.IdempotencyService,
        core_1.Reflector])
], IdempotencyInterceptor);
//# sourceMappingURL=idempotency.interceptor.js.map