import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { IdempotencyService } from './idempotency.service';

export const IDEMPOTENT_KEY = 'nextops:idempotent';
export const Idempotent = (): MethodDecorator =>
  ((_target: object, _propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(IDEMPOTENT_KEY, true, descriptor.value as object);
    return descriptor;
  }) as MethodDecorator;

interface IdempotentRequest extends Request {
  user?: { id?: string };
}

/**
 * Wraps mutating endpoints decorated with @Idempotent() in the Redis-backed
 * IdempotencyService. Requires an Idempotency-Key header on those requests.
 */
@Injectable()
export class IdempotencyInterceptor {
  constructor(
    private readonly idempotency: IdempotencyService,
    private readonly reflector: Reflector,
  ) { }

  private static resolveBody(value: unknown): object {
    return typeof value === 'object' && value !== null ? (value as object) : {};
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const isIdempotent = this.reflector.get<boolean>(
      IDEMPOTENT_KEY,
      context.getHandler(),
    );
    const request = context.switchToHttp().getRequest<IdempotentRequest>();
    const idempotencyKey = request.headers['idempotency-key'];
    const firstValue =
      Array.isArray(idempotencyKey) && idempotencyKey.length > 0
        ? idempotencyKey[0]
        : idempotencyKey;

    if (!isIdempotent || typeof firstValue !== 'string') {
      return next.handle();
    }

    const scope = `${request.method ?? 'MUTATION'}:${request.user?.id ?? 'anon'}`;
    const body = IdempotencyInterceptor.resolveBody(request.body);

    return new Observable<unknown>((subscriber) => {
      this.idempotency
        .execute<object>(scope, firstValue, body, () => {
          return new Promise<object>((resolve, reject) => {
            next.handle().subscribe({
              next: (value: unknown) => resolve(value as object),
              error: (error: unknown) => reject(error instanceof Error ? error : new Error(String(error))),
            });
          });
        })
        .then((result) => subscriber.next(result))
        .catch((error: unknown) => {
          if (error instanceof NotFoundException || error instanceof Error) {
            subscriber.error(error);
          } else {
            subscriber.error(new Error(String(error)));
          }
        })
        .finally(() => subscriber.complete());
    });
  }
}
