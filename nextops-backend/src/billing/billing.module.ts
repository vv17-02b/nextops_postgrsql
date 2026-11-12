import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PlanEnforcementService } from './plan-enforcement.service';
import { SubscriptionGuard } from './subscription.guard';

@Global()
@Module({
  controllers: [BillingController],
  providers: [
    BillingService,
    PlanEnforcementService,
    SubscriptionGuard,
    { provide: APP_GUARD, useExisting: SubscriptionGuard },
  ],
  exports: [BillingService, PlanEnforcementService],
})
export class BillingModule {}
