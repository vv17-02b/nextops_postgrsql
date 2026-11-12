import { Controller, Get, Param, Delete, Inject, Query, Req, MethodNotAllowedException, Post, Patch } from '@nestjs/common';
import type { Request } from 'express';
import { SessionService } from './session.service';
import type { Session } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';
import { Roles } from '../auth/roles.decorator';

export type SafeSession = Omit<Session, 'sessionToken'>;

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    companyId?: string;
  };
}

function toSafeSession(session: Session): SafeSession {
  const { sessionToken: _ignored, ...safe } = session;
  void _ignored;
  return safe;
}

@Controller('session')
@Roles('OWNER', 'ADMIN')
export class SessionController {
  constructor(
    @Inject(SessionService)
    private readonly service: SessionService,
  ) {}

  @Post()
  create(): never {
    throw new MethodNotAllowedException('Manual session creation via API is disabled for security reasons.');
  }

  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
    @Req() req: RequestWithUser,
  ): Promise<PaginatedResponse<SafeSession>> {
    const result = await this.service.findAll(query, req.user?.companyId);
    return {
      ...result,
      data: result.data.map(toSafeSession),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: RequestWithUser): Promise<SafeSession> {
    const session = await this.service.findOne(id, req.user?.companyId);
    return toSafeSession(session);
  }

  @Patch(':id')
  update(): never {
    throw new MethodNotAllowedException('Session modification via API is disabled for security reasons.');
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: RequestWithUser): Promise<SafeSession> {
    const session = await this.service.remove(id, req.user?.companyId);
    return toSafeSession(session);
  }
}
