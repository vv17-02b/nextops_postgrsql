import { Controller, Get, Param, Delete, Inject, Query, Req, MethodNotAllowedException, Post, Patch } from '@nestjs/common';
import type { Request } from 'express';
import { VerificationTokenService } from './verificationtoken.service';
import type { VerificationToken } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';
import { Roles } from '../auth/roles.decorator';

export type SafeVerificationToken = Omit<VerificationToken, 'token'>;

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    companyId?: string;
  };
}

function toSafeVerificationToken(record: VerificationToken): SafeVerificationToken {
  const { token: _ignored, ...safe } = record;
  void _ignored;
  return safe;
}

@Controller('verificationtoken')
@Roles('OWNER', 'ADMIN')
export class VerificationTokenController {
  constructor(
    @Inject(VerificationTokenService)
    private readonly service: VerificationTokenService,
  ) {}

  @Post()
  create(): never {
    throw new MethodNotAllowedException('Manual verification token creation via API is disabled for security reasons.');
  }

  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
    @Req() req: RequestWithUser,
  ): Promise<PaginatedResponse<SafeVerificationToken>> {
    const result = await this.service.findAll(query, req.user?.companyId);
    return {
      ...result,
      data: result.data.map(toSafeVerificationToken),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: RequestWithUser): Promise<SafeVerificationToken> {
    const record = await this.service.findOne(id, req.user?.companyId);
    return toSafeVerificationToken(record);
  }

  @Patch(':id')
  update(): never {
    throw new MethodNotAllowedException('Verification token modification via API is disabled for security reasons.');
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: RequestWithUser): Promise<SafeVerificationToken> {
    const record = await this.service.remove(id, req.user?.companyId);
    return toSafeVerificationToken(record);
  }
}
