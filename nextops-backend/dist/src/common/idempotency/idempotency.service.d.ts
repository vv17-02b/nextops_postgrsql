import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
export declare class IdempotencyService implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private readonly client;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    execute<T>(scope: string, key: string, request: unknown, action: () => Promise<T>): Promise<T>;
    private readCachedResult;
    private toText;
}
