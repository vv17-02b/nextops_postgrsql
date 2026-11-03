import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { Request } from 'express';
export declare class TokenRevocationService implements OnModuleInit, OnModuleDestroy {
    private readonly client;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private static tokenFingerprint;
    revokeToken(token: string, expiresAtMs: number): Promise<void>;
    isTokenRevoked(token: string): Promise<boolean>;
    bumpSessionEpoch(userId: string): Promise<number>;
    getSessionEpoch(userId: string): Promise<number>;
    static extractToken(request: Request): string | undefined;
}
