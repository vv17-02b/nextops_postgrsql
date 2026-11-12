import { ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../prisma/tenant-context';
import { jwtSecret } from '../jwt-secret';
import type { Request } from 'express';
import { readCookie, SESSION_COOKIE } from '../cookie-session';
import { TokenRevocationService } from '../token-revocation.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(TenantContext) private readonly tenantContext: TenantContext,
    private readonly tokenRevocation: TokenRevocationService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request | null) => {
          if (!request) return null;
          const token =
            readCookie(request, SESSION_COOKIE) ??
            ExtractJwt.fromAuthHeaderAsBearerToken()(request);
          if (token) (request as Request & { rawToken?: string }).rawToken = token;
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret as string,
    });
  }

  async validate(
    payload: { sub?: string; epoch?: number } & Record<string, unknown>,
    request?: Request & { rawToken?: string },
  ): Promise<{
    id: string;
    email: string | null;
    companyId: string;
    role: string;
  }> {
    if (!payload.sub) throw new UnauthorizedException('Invalid authentication token.');

    // Fail closed when Redis knows the token or its session epoch is stale.
    if (request?.rawToken) {
      const revoked = await this.tokenRevocation.isTokenRevoked(request.rawToken);
      if (revoked) throw new UnauthorizedException('This session has been revoked.');
      const currentEpoch = await this.tokenRevocation.getSessionEpoch(payload.sub);
      if ((payload.epoch ?? 0) < currentEpoch) {
        throw new UnauthorizedException('This session has been revoked.');
      }
    }

    const user = await this.prisma.runSystemQuery(() =>
      this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, companyId: true, role: true },
      }),
    );
    if (!user) throw new UnauthorizedException('The account is no longer available.');
    if (!user.companyId) {
      throw new ForbiddenException('This account is not assigned to a business workspace.');
    }

    this.tenantContext.setCompanyId(user.companyId);
    return {
      ...user,
      role: user.role === 'USER' ? 'MEMBER' : user.role,
      companyId: user.companyId,
    };
  }
}
