import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { IdempotencyService } from './idempotency.service';
export declare const IDEMPOTENT_KEY = "nextops:idempotent";
export declare const Idempotent: () => MethodDecorator;
export declare class IdempotencyInterceptor {
    private readonly idempotency;
    private readonly reflector;
    constructor(idempotency: IdempotencyService, reflector: Reflector);
    private static resolveBody;
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
}
