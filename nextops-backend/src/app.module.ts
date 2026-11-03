import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AccountModule } from './account/account.module';
import { AgentKnowledgeBaseModule } from './agentknowledgebase/agentknowledgebase.module';
import { ApiHistoryModule } from './apihistory/apihistory.module';
import { CategoryModule } from './category/category.module';
import { OrderModule } from './order/order.module';
import { OrderItemModule } from './orderitem/orderitem.module';
import { ProductModule } from './product/product.module';
import { ProjectModule } from './project/project.module';
import { ReviewModule } from './review/review.module';
import { SessionModule } from './session/session.module';
import { UserModule } from './user/user.module';
import { UserAiBudgetModule } from './useraibudget/useraibudget.module';
import { VerificationTokenModule } from './verificationtoken/verificationtoken.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { WebhookConfigModule } from './webhookconfig/webhookconfig.module';
import { HealthModule } from './health/health.module';
import { IdempotencyModule, IdempotencyInterceptor } from './common/idempotency/idempotency.module';
import { TenantContext } from './prisma/tenant-context';
import { QueueModule } from './common/queue/queue.module';
import { InvitationModule } from './invitation/invitation.module';

@Module({
  imports: [
    PrismaModule,
    IdempotencyModule,
    QueueModule,
    InvitationModule,
    AuthModule,
    AccountModule,
    AgentKnowledgeBaseModule,
    ApiHistoryModule,
    CategoryModule,
    OrderModule,
    OrderItemModule,
    ProductModule,
    ProjectModule,
    ReviewModule,
    SessionModule,
    UserModule,
    UserAiBudgetModule,
    VerificationTokenModule,
    WarehouseModule,
    WebhookConfigModule,
    HealthModule
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotencyInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TenantContext).forRoutes('*splat');
  }
}
