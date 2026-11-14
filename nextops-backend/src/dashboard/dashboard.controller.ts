import { Controller, Get, Inject, Req } from '@nestjs/common';
import type { Request } from 'express';
import { DashboardService, type DashboardOverviewResponse } from './dashboard.service';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    companyId?: string;
  };
}

@Controller('dashboard')
export class DashboardController {
  constructor(
    @Inject(DashboardService)
    private readonly dashboardService: DashboardService,
  ) {}

  @Get('overview')
  getOverview(@Req() req: RequestWithUser): Promise<DashboardOverviewResponse> {
    return this.dashboardService.getOverview(req.user?.companyId);
  }
}
