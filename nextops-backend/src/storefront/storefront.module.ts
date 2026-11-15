import { Module } from '@nestjs/common';
import { OrderModule } from '../order/order.module';
import { AgentKnowledgeBaseModule } from '../agentknowledgebase/agentknowledgebase.module';
import { StorefrontController } from './storefront.controller';
import { StorefrontDocsController } from './storefront-docs.controller';
import { StorefrontService } from './storefront.service';

@Module({
  imports: [OrderModule, AgentKnowledgeBaseModule],
  controllers: [StorefrontController, StorefrontDocsController],
  providers: [StorefrontService],
})
export class StorefrontModule {}
