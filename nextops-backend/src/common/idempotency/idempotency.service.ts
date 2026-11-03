import { createHash } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createClient } from 'redis';

interface StoredResult<T> {
  state: 'complete';
  requestHash: string;
  response: T;
}

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

@Injectable()
export class IdempotencyService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IdempotencyService.name);
  private readonly client = process.env.REDIS_URL
    ? createClient({ url: process.env.REDIS_URL })
    : null;

  constructor() {
    this.client?.on('error', (error: Error) => {
      this.logger.error('Redis connection error', error.message);
    });
  }

  async onModuleInit(): Promise<void> {
    if (this.client && !this.client.isOpen) {
      await this.client.connect();
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client?.isOpen) {
      await this.client.quit();
    }
  }

  async execute<T>(
    scope: string,
    key: string,
    request: unknown,
    action: () => Promise<T>,
  ): Promise<T> {
    if (!/^[\w.-]{8,200}$/.test(key)) {
      throw new BadRequestException({
        message: 'A valid Idempotency-Key header is required.',
        errorCode: 'INVALID_IDEMPOTENCY_KEY',
      });
    }

    if (!this.client?.isReady) {
      throw new ServiceUnavailableException({
        message: 'The idempotency service is unavailable.',
        errorCode: 'IDEMPOTENCY_UNAVAILABLE',
      });
    }

    const requestHash = createHash('sha256')
      .update(JSON.stringify(request))
      .digest('hex');
    const redisKey = `nextops:idempotency:${scope}:${key}`;
    const existing = await this.client.get(redisKey);

    if (existing) {
      return this.readCachedResult<T>(this.toText(existing), requestHash);
    }

    const lockValue = `processing:${requestHash}`;
    const lockAcquired = await this.client.set(redisKey, lockValue, {
      NX: true,
      PX: 5 * 60 * 1000,
    });

    if (lockAcquired !== 'OK') {
      const current = await this.client.get(redisKey);
      if (current && current !== lockValue) {
        return this.readCachedResult<T>(this.toText(current), requestHash);
      }
      throw new ConflictException({
        message: 'A request with this idempotency key is already in progress.',
        errorCode: 'IDEMPOTENCY_IN_PROGRESS',
      });
    }

    try {
      const result = await action();
      const cached: StoredResult<T> = {
        state: 'complete',
        requestHash,
        response: result,
      };
      const saved = await this.client.eval(COMPLETE_RESULT_SCRIPT, {
        keys: [redisKey],
        arguments: [lockValue, JSON.stringify(cached), String(24 * 60 * 60 * 1000)],
      });

      if (saved !== 1) {
        throw new ServiceUnavailableException({
          message: 'The idempotency result could not be safely stored.',
          errorCode: 'IDEMPOTENCY_RESULT_NOT_STORED',
        });
      }

      return result;
    } catch (error) {
      await this.client.eval(DELETE_LOCK_SCRIPT, {
        keys: [redisKey],
        arguments: [lockValue],
      });
      throw error;
    }
  }

  private readCachedResult<T>(value: string, requestHash: string): T {
    if (value.startsWith('processing:')) {
      if (value !== `processing:${requestHash}`) {
        throw new ConflictException({
          message: 'This idempotency key is already in use for another request.',
          errorCode: 'IDEMPOTENCY_KEY_REUSED',
        });
      }
      throw new ConflictException({
        message: 'A request with this idempotency key is already in progress.',
        errorCode: 'IDEMPOTENCY_IN_PROGRESS',
      });
    }

    const result = JSON.parse(value) as StoredResult<T>;
    if (result.state !== 'complete' || result.requestHash !== requestHash) {
      throw new ConflictException({
        message: 'This idempotency key is already in use for another request.',
        errorCode: 'IDEMPOTENCY_KEY_REUSED',
      });
    }
    return result.response;
  }

  private toText(value: string | Buffer): string {
    return typeof value === 'string' ? value : value.toString('utf8');
  }
}
