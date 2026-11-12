import { Inject, Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../public.decorator';
import { TenantContext } from '../../prisma/tenant-context';

interface JwtPayloadUser {
  id: string;
  email: string;
  companyId?: string;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(TenantContext) private readonly tenantContext: TenantContext,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }

  handleRequest<TUser = JwtPayloadUser>(err: unknown, user: TUser | false): TUser {
    if (err || !user) {
      if (err instanceof Error) {
        throw err;
      }
      throw new UnauthorizedException('Доступ заблоковано. Необхідно надати валідний JWT-токен');
    }

    const typedUser = user as unknown as JwtPayloadUser;
    if (typedUser.companyId) {
      this.tenantContext.setCompanyId(typedUser.companyId);
    }

    return user;
  }
}
