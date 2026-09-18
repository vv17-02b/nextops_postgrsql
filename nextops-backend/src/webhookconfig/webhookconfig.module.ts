import { Module } from '@nestjs/common';
import { WebhookConfigService } from './webhookconfig.service';
import { WebhookConfigController } from './webhookconfig.controller';

@Module({
  controllers: [WebhookConfigController],
  providers: [WebhookConfigService],
  exports: [WebhookConfigService]
})
export class WebhookConfigModule {}
