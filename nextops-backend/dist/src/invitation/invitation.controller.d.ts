import type { Request } from 'express';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationService } from './invitation.service';
export declare class InvitationController {
    private readonly service;
    constructor(service: InvitationService);
    invite(dto: CreateInvitationDto, request: Request & {
        user: {
            role: string;
        };
    }): Promise<{
        success: true;
    }>;
    accept(dto: AcceptInvitationDto): Promise<{
        success: true;
    }>;
}
