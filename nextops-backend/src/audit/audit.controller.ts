import { Controller, Get, Inject, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../auth/roles.decorator';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { AuditService } from './audit.service';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
    companyId?: string;
  };
}

@Controller('audit')
@Roles('OWNER', 'ADMIN')
export class AuditController {
  constructor(
    @Inject(AuditService)
    private readonly auditService: AuditService,
  ) {}

  @Get()
  findAll(@Query() query: PaginationQueryDto, @Req() req: RequestWithUser) {
    return this.auditService.findAll(query, req.user?.companyId);
  }
}
