import { Controller, Post, Body, UnauthorizedException, Inject, ConflictException, Req, Get, Res } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { RegisterCredentialsDto } from './dto/register-credentials.dto';
import { Public } from './public.decorator';
import { RateLimit } from './rate-limit.guard';
import { hashPassword, verifyPassword } from './password-hasher';
import { clearedSessionCookieOptions, csrfCookieOptions, sessionCookieOptions, SESSION_COOKIE, CSRF_COOKIE, readCookie } from './cookie-session';
import { TokenRevocationService } from './token-revocation.service';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-recovery.dto';
import { EmailQueueService } from '../common/queue/email-queue.service';

const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000; // 30 minutes

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(JwtService)
    private readonly jwtService: JwtService,
    @Inject(TenantContext)
    private readonly tenantContext: TenantContext,
    @Inject(TokenRevocationService)
    private readonly tokenRevocation: TokenRevocationService,
    private readonly emailQueue: EmailQueueService,
  ) {}

  private async issueSessionCookies(
    response: Response,
    user: { id: string; email: string | null; role: string },
  ): Promise<void> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      epoch: await this.tokenRevocation.getSessionEpoch(user.id),
    };
    const token = this.jwtService.sign(payload);
    const csrfToken = randomBytes(32).toString('base64url');
    response.cookie(SESSION_COOKIE, token, sessionCookieOptions());
    response.cookie(CSRF_COOKIE, csrfToken, csrfCookieOptions());
  }

  @Post('register')
  @Public()
  @RateLimit(5, 900)
  async register(
    @Body() dto: RegisterCredentialsDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{
    success: true;
    message: string;
    userId: string;
    companyId: string;
    user: { id: string; email: string | null; role: string; companyId: string };
  }> {
    const email = dto.email.trim().toLowerCase();
    const exists = await this.prisma.runSystemQuery(() =>
      this.prisma.user.findUnique({ where: { email } }),
    );
    if (exists) throw new ConflictException('An account with this email already exists.');

    const passwordHash = await hashPassword(dto.password);
    const created = await this.prisma.runSystemQuery(() =>
      this.prisma.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: {
            name: `${email.split('@')} Workspace`,
            planCode: 'FREE',
            subscriptionStatus: 'TRIALING',
          },
        });
        const user = await tx.user.create({
          data: {
            email,
            passwordHash,
            role: 'OWNER',
            companyId: company.id,
          },
        });

        await tx.userAiBudget.create({
          data: {
            userId: user.id,
            companyId: company.id,
            monthlyLimitMinor: 1000, // $10.00
            resetDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
          },
        });

        return {
          userId: user.id,
          companyId: company.id,
          email: user.email,
          role: user.role,
        };
      }),
    );

    this.tenantContext.setCompanyId(created.companyId);
    (request as Request & { user?: { id: string } }).user = { id: created.userId };
    await this.issueSessionCookies(response, {
      id: created.userId,
      email: created.email,
      role: created.role,
    });

    return {
      success: true,
      message: 'Business workspace created.',
      userId: created.userId,
      companyId: created.companyId,
      user: {
        id: created.userId,
        email: created.email,
        role: created.role,
        companyId: created.companyId,
      },
    };
  }

  @Post('login')
  @Public()
  @RateLimit(10, 900)
  async login(@Body() dto: AuthCredentialsDto, @Res({ passthrough: true }) response: Response): Promise<{
    success: true;
    user: { id: string; email: string | null; role: string; companyId: string };
  }> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.runSystemQuery(() =>
      this.prisma.user.findUnique({ where: { email } }),
    );
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const verification = await verifyPassword(dto.password, user.passwordHash);
    if (!verification.valid) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    if (!user.companyId) {
      throw new UnauthorizedException(
        'This account has no business workspace. Contact an administrator to migrate it.',
      );
    }
    this.tenantContext.setCompanyId(user.companyId);
    if (verification.needsRehash) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await hashPassword(dto.password) },
      });
    }

    await this.issueSessionCookies(response, {
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      },
    };
  }

  @Get('csrf')
  @Public()
  csrf(
    @Req() request: Request & { csrfToken?: string },
    @Res({ passthrough: true }) response: Response,
  ): { csrfToken: string } {
    const csrfToken = request.csrfToken ?? readCookie(request, CSRF_COOKIE) ?? randomBytes(32).toString('base64url');
    response.cookie(CSRF_COOKIE, csrfToken, csrfCookieOptions());
    return { csrfToken };
  }

  @Get('me')
  currentUser(
    @Req() request: Request & {
      user: { id: string; email: string | null; role: string; companyId: string };
    },
  ): { user: { id: string; email: string | null; role: string; companyId: string } } {
    return { user: request.user };
  }

  @Post('logout')
  @Public()
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ success: true }> {
    const token = TokenRevocationService.extractToken(request);
    if (token) {
      try {
        const payload = this.jwtService.decode(token) as { exp?: number } | null;
        const expiresAtMs = payload?.exp ? payload.exp * 1000 : Date.now();
        await this.tokenRevocation.revokeToken(token, expiresAtMs);
      } catch {
        // Malformed token: cookie clearing below is enough.
      }
    }
    response.clearCookie(SESSION_COOKIE, clearedSessionCookieOptions());
    return { success: true };
  }

  @Post('forgot-password')
  @Public()
  @RateLimit(5, 900)
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ success: true; message: string }> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.runSystemQuery(() =>
      this.prisma.user.findUnique({ where: { email } }),
    );
    if (!user || !user.companyId) {
      return { success: true, message: 'If the account exists, a reset link has been sent.' };
    }

    this.tenantContext.setCompanyId(user.companyId);
    const token = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

    await this.prisma.verificationToken.create({
      data: {
        companyId: user.companyId,
        identifier: user.email ?? email,
        token: tokenHash,
        expires,
      },
    });

    const resetUrl = new URL('/reset-password', process.env.FRONTEND_URL ?? 'http://localhost:3000');
    resetUrl.searchParams.set('token', token);

    try {
      await this.emailQueue.enqueueInvitation({
        email,
        companyName: `PASSWORD_RESET:${user.companyId}`,
        invitationUrl: resetUrl.toString(),
      });
    } catch {
      // Without SMTP/Redis the token stays valid in DB; support can relay it manually.
    }

    return { success: true, message: 'If the account exists, a reset link has been sent.' };
  }

  @Post('reset-password')
  @Public()
  @RateLimit(10, 900)
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ success: true }> {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    const record = await this.prisma.runSystemQuery(() =>
      this.prisma.verificationToken.findUnique({ where: { token: tokenHash } }),
    );
    if (!record || record.expires.getTime() < Date.now()) {
      throw new UnauthorizedException('This password reset link is invalid or has expired.');
    }

    this.tenantContext.setCompanyId(record.companyId);
    const user = await this.prisma.user.findFirst({
      where: { email: record.identifier },
      select: { id: true },
    });
    if (!user) {
      throw new UnauthorizedException('This password reset link is invalid or has expired.');
    }

    const passwordHash = await hashPassword(dto.password);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      this.prisma.verificationToken.delete({ where: { token: tokenHash } }),
    ]);

    await this.tokenRevocation.bumpSessionEpoch(user.id);

    return { success: true };
  }
  @Post('logout-all')
  async logoutAll(
    @Req() request: Request & { user: { id: string } },
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ success: true }> {
    await this.tokenRevocation.bumpSessionEpoch(request.user.id);
    const token = TokenRevocationService.extractToken(request);
    if (token) {
      try {
        const payload = this.jwtService.decode(token) as { exp?: number } | null;
        await this.tokenRevocation.revokeToken(token, payload?.exp ? payload.exp * 1000 : Date.now());
      } catch {
        // Ignore decode issues; epoch bump already kills all sessions.
      }
    }
    response.clearCookie(SESSION_COOKIE, clearedSessionCookieOptions());
    return { success: true };
  }
}
