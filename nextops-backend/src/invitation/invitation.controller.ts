import { Body, Controller, Inject, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationService } from './invitation.service';

@Controller('invitation')
export class InvitationController {
  constructor(
    @Inject(InvitationService) private readonly service: InvitationService,
  ) {}

  @Post()
  @Roles('OWNER', 'ADMIN')
  invite(
    @Body() dto: CreateInvitationDto,
    @Req() request: Request & { user: { role: string } },
  ): Promise<{ success: true }> {
    return this.service.invite(dto, request.user.role);
  }

  @Post('accept')
  @Public()
  accept(@Body() dto: AcceptInvitationDto): Promise<{ success: true }> {
    return this.service.accept(dto);
  }
}
