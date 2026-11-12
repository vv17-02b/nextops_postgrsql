import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { createClient } from 'redis';

export const RATE_LIMIT_KEY = 'rateLimitPolicy';

export interface RateLimitPolicy {
  limit: number;
  windowSeconds: number;
}

export const RateLimit = (limit: number, windowSeconds: number) =>
  SetMetadata(RATE_LIMIT_KEY, { limit, windowSeconds } satisfies RateLimitPolicy);

@Injectable()
export class RedisRateLimitGuard implements CanActivate, OnModuleInit, OnModuleDestroy {
  private readonly redis = process.env.REDIS_URL
    ? createClient({ url: process.env.REDIS_URL })
    : null;

  constructor(
    @Inject(Reflector)
    private readonly reflector: Reflector,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.redis && !this.redis.isOpen) {
      await this.redis.connect().catch(() => undefined);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis?.isOpen) {
      await this.redis.quit().catch(() => undefined);
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;

    const policy = this.reflector.getAllAndOverride<RateLimitPolicy | undefined>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!policy) return true;

    if (!this.redis?.isReady) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const forwarded = request.headers['x-forwarded-for'];
        const clientIp =
      (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]?.trim()) ||
      request.ip ||
      'unknown';

    const routeKey = `${request.method}:${request.baseUrl}${request.path}`;
    const redisKey = `nextops:ratelimit:${routeKey}:${clientIp}`;

    const currentCount = await this.redis.incr(redisKey);
    if (currentCount === 1) {
      await this.redis.expire(redisKey, policy.windowSeconds);
    }

    if (currentCount > policy.limit) {
      const ttl = await this.redis.ttl(redisKey);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          errorCode: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests. Please try again in ${Math.max(1, ttl)} seconds.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
