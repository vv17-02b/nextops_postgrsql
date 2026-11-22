import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { PlatformOwnerGuard } from './platform-owner.guard';
import {
  PlatformService,
  type PlatformCompanyFilter,
  type PlatformOverviewResponse,
} from './platform.service';

export class PlatformCompaniesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(['ALL', 'PAID', 'EMPTY', 'BLOCKED'])
  filter?: PlatformCompanyFilter;
}

export class ActivateCompanyDto {
  @IsOptional()
  @IsString()
  planCode?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  days?: number;
}

export class CleanupEmptyCompaniesDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3650)
  olderThanDays?: number;
}

@Controller('platform/companies')
@UseGuards(PlatformOwnerGuard)
export class PlatformController {
  constructor(
    @Inject(PlatformService)
    private readonly platformService: PlatformService,
  ) {}

  @Get()
  getOverview(@Query() query: PlatformCompaniesQueryDto): Promise<PlatformOverviewResponse> {
    return this.platformService.getPlatformOverview(query);
  }

  @Post('cleanup-empty')
  cleanupEmpty(@Body() dto: CleanupEmptyCompaniesDto): Promise<{ deletedCount: number }> {
    return this.platformService.cleanupEmptyCompanies(dto.olderThanDays ?? 7);
  }

  @Post(':id/suspend')
  suspendCompany(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ suspended: true; id: string; name: string }> {
    return this.platformService.suspendCompany(id);
  }

  @Post(':id/activate')
  activateCompany(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActivateCompanyDto,
  ): Promise<{
    activated: true;
    id: string;
    name: string;
    planCode: string;
    currentPeriodEnd: string | null;
  }> {
    return this.platformService.activateCompany(id, dto.planCode, dto.days);
  }

  @Delete(':id')
  deleteCompany(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ deleted: true; id: string; name: string }> {
    return this.platformService.deleteCompanyPermanently(id);
  }
}
