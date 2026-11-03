import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TenantContext } from './tenant-context';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor(tenantContext: TenantContext);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
