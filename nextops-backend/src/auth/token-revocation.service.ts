import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createClient } from 'redis';
import { createHash } from 'node:crypto';
import type { Request } from 'express';
import { readCookie, SESSION_COOKIE } from './cookie-session';

const REVOCATION_PREFIX = 'nextops:jwt-revoked:';
const SESSION_INDEX_PREFIX = 'nextops:jwt-sessions:';

/**
 * Redis-backed JWT revocation registry.
 *
 * A JWT is revoked by storing its jti (token ID) until its exp. Session
 * revocation ("log out everywhere") revokes every token issued for a user by
 * bumping that user's session epoch: all tokens signed before the new epoch
 * are considered invalid.
 */
@Injectable()
export class TokenRevocationService implements OnModuleInit, OnModuleDestroy {
  private readonly client = process.env.REDIS_URL
    ? createClient({ url: process.env.REDIS_URL })
    : null;

  async onModuleInit(): Promise<void> {
    if (this.client && !this.client.isOpen) {
      await this.client.connect().catch(() => undefined);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client?.isOpen) {
      await this.client.quit().catch(() => undefined);
    }
  }

  private static tokenFingerprint(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** Store the token fingerprint until it naturally expires. */
  async revokeToken(token: string, expiresAtMs: number): Promise<void> {
    if (!this.client?.isReady) return;
    const ttl = expiresAtMs - Date.now();
    if (ttl <= 0) return;
    await this.client
      .set(REVOCATION_PREFIX + TokenRevocationService.tokenFingerprint(token), '1', { PX: ttl })
      .catch(() => undefined);
  }

  async isTokenRevoked(token: string): Promise<boolean> {
    if (!this.client?.isReady) return false;
    const revoked = await this.client
      .get(REVOCATION_PREFIX + TokenRevocationService.tokenFingerprint(token))
      .catch(() => null);
    return revoked === '1';
  }

  /**
   * Increments the user's session epoch: every previously issued token becomes
   * stale and is rejected by validateToken(). Returns the new epoch.
   */
  async bumpSessionEpoch(userId: string): Promise<number> {
    if (!this.client?.isReady) return 0;
    const epoch = await this.client.incr(SESSION_INDEX_PREFIX + userId);
    return epoch;
  }

  /** Returns the user's current session epoch, or 0 when unknown. */
  async getSessionEpoch(userId: string): Promise<number> {
    if (!this.client?.isReady) return 0;
    const epoch = await this.client.get(SESSION_INDEX_PREFIX + userId).catch(() => null);
    return epoch ? Number(epoch) : 0;
  }

  /** Extract the bearer/session token from a request for revocation calls. */
  static extractToken(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice('Bearer '.length);
    }
    return readCookie(request, SESSION_COOKIE);
  }
}
