import { Body, Controller, Inject, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { RateLimit } from '../auth/rate-limit.guard';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationService } from './invitation.service';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email?: string;
    role: string;
    companyId?: string;
  };
}

@Controller('invitation')
export class InvitationController {
  constructor(
    @Inject(InvitationService) private readonly service: InvitationService,
  ) {}

  @Post()
  @Roles('OWNER', 'ADMIN')
  invite(
    @Body() dto: CreateInvitationDto,
    @Req() request: RequestWithUser,
  ): Promise<{ success: true }> {
    return this.service.invite(dto, request.user.role, request.user.companyId);
  }

  @Post('accept')
  @Public()
  @RateLimit(10, 900)
  accept(@Body() dto: AcceptInvitationDto): Promise<{ success: true }> {
    return this.service.accept(dto);
  }
}
