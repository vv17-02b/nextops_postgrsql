import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaService } from './prisma.service';
import { TenantContext } from './tenant-context';
import { TenantInterceptor } from './tenant.interceptor';

@Global()
@Module({
  providers: [
    TenantContext,
    PrismaService,
    TenantInterceptor,
    { provide: APP_INTERCEPTOR, useExisting: TenantInterceptor },
  ],
  exports: [PrismaService, TenantContext],
})
export class PrismaModule {}
