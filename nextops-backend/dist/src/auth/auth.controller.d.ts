import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { RegisterCredentialsDto } from './dto/register-credentials.dto';
import { TokenRevocationService } from './token-revocation.service';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-recovery.dto';
import { EmailQueueService } from '../common/queue/email-queue.service';
export declare class AuthController {
    private readonly prisma;
    private readonly jwtService;
    private readonly tenantContext;
    private readonly tokenRevocation;
    private readonly emailQueue;
    constructor(prisma: PrismaService, jwtService: JwtService, tenantContext: TenantContext, tokenRevocation: TokenRevocationService, emailQueue: EmailQueueService);
    register(dto: RegisterCredentialsDto, request: Request): Promise<{
        success: true;
        message: string;
        userId: string;
        companyId: string;
    }>;
    login(dto: AuthCredentialsDto, response: Response): Promise<{
        success: true;
        user: {
            id: string;
            email: string | null;
            role: string;
            companyId: string;
        };
    }>;
    csrf(request: Request & {
        csrfToken?: string;
    }, response: Response): {
        csrfToken: string;
    };
    currentUser(request: Request & {
        user: {
            id: string;
            email: string | null;
            role: string;
            companyId: string;
        };
    }): {
        user: {
            id: string;
            email: string | null;
            role: string;
            companyId: string;
        };
    };
    logout(request: Request, response: Response): Promise<{
        success: true;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        success: true;
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        success: true;
    }>;
    logoutAll(request: Request & {
        user: {
            id: string;
        };
    }, response: Response): Promise<{
        success: true;
    }>;
}
