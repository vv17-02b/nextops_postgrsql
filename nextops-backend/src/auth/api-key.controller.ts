import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { Roles } from './roles.decorator';
import {
  ApiKeyService,
  type ApiKeyQuotaSummary,
  type ApiKeySummary,
} from './api-key.service';

export class CreateApiKeyDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  scopes?: string[];

  @IsInt()
  @Min(1)
  @Max(3650)
  @IsOptional()
  expiresInDays?: number;
}

interface RequestWithUser extends Request {
  user?: {
    id: string;
    companyId?: string;
  };
}

@Controller('api-keys')
export class ApiKeyController {
  constructor(
    @Inject(ApiKeyService)
    private readonly apiKeyService: ApiKeyService,
  ) {}

  @Get()
  @Roles('OWNER', 'ADMIN')
  listKeys(
    @Req() req: RequestWithUser,
  ): Promise<{ keys: ApiKeySummary[]; quota: ApiKeyQuotaSummary }> {
    return this.apiKeyService.listKeys(req.user?.companyId);
  }

  @Post()
  @Roles('OWNER', 'ADMIN')
  createKey(
    @Body() dto: CreateApiKeyDto,
    @Req() req: RequestWithUser,
  ): Promise<ApiKeySummary & { apiKey: string }> {
    return this.apiKeyService.createKey(
      dto.name,
      dto.scopes,
      req.user?.companyId,
      dto.expiresInDays,
    );
  }

  @Delete(':id')
  @Roles('OWNER', 'ADMIN')
  revokeKey(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<{ revoked: true }> {
    return this.apiKeyService.revokeKey(id, req.user?.companyId);
  }
}
