import {
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import {
  BillingService,
  type BillingWebhookPayload,
  type NotificationSoundOption,
  type TelegramNotificationEvent,
} from './billing.service';

export class CreateCheckoutDto {
  @IsString()
  @IsNotEmpty()
  planCode!: string;
}

export class ConfigureTelegramDto {
  @IsString()
  @IsOptional()
  botToken?: string;

  @IsString()
  @IsNotEmpty()
  chatId!: string;
}

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
    companyId?: string;
  };
  rawBody?: Buffer;
}

@Controller('billing')
export class BillingController {
  constructor(
    @Inject(BillingService)
    private readonly billingService: BillingService,
  ) {}

  @Get('status')
  getStatus(@Req() req: RequestWithUser) {
    return this.billingService.getStatus(req.user?.companyId);
  }

  @Get('sounds')
  listSounds(): Promise<{ sounds: NotificationSoundOption[] }> {
    return this.billingService.listNotificationSounds();
  }

  @Get('notifications')
  listNotifications(@Req() req: RequestWithUser): Promise<{ events: TelegramNotificationEvent[] }> {
    return this.billingService.getRecentTelegramNotifications(req.user?.companyId);
  }

  @Post('checkout')
  @Roles('OWNER', 'ADMIN')
  createCheckout(
    @Body() dto: CreateCheckoutDto,
    @Req() req: RequestWithUser,
  ): Promise<{ checkoutUrl: string }> {
    return this.billingService.createCheckout(dto.planCode, req.user?.companyId);
  }

  @Post('telegram')
  @Roles('OWNER', 'ADMIN')
  configureTelegram(
    @Body() dto: ConfigureTelegramDto,
    @Req() req: RequestWithUser,
  ): Promise<{ connected: boolean; chatId: string }> {
    return this.billingService.configureTelegram(dto.botToken ?? '', dto.chatId, true, req.user?.companyId);
  }

  @Post('telegram/connect-env')
  @Roles('OWNER', 'ADMIN')
  connectPlatformTelegram(
    @Req() req: RequestWithUser,
  ): Promise<{ connected: boolean; chatId: string }> {
    return this.billingService.connectPlatformTelegramFromEnv(req.user?.companyId);
  }

  @Post('webhook')
  @Public()
  handleWebhook(
    @Headers('x-billing-signature') signature: string | undefined,
    @Body() payload: BillingWebhookPayload,
    @Req() req: RequestWithUser,
  ): Promise<{ received: true; deduplicated?: boolean }> {
    const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(payload ?? {});
    return this.billingService.processSignedWebhook(rawBody, signature, payload);
  }
}
