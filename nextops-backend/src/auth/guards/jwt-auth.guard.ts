import { Inject, Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../public.decorator';
import { TenantContext } from '../../prisma/tenant-context';
import { ApiKeyService } from '../api-key.service';

interface JwtPayloadUser {
  id: string;
  email: string;
  role?: string;
  companyId?: string;
  scopes?: string[];
}

interface RequestWithApiUser extends Request {
  user?: JwtPayloadUser;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(TenantContext) private readonly tenantContext: TenantContext,
    @Inject(ApiKeyService) private readonly apiKeyService: ApiKeyService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<RequestWithApiUser>();
    const rawApiKeyHeader = request.headers['x-api-key'];
    const rawApiKey = Array.isArray(rawApiKeyHeader) ? rawApiKeyHeader[0] : rawApiKeyHeader;

    if (typeof rawApiKey === 'string' && rawApiKey.trim().length > 0) {
      const apiKeyCtx = await this.apiKeyService.validateRawApiKey(rawApiKey);
      if (!apiKeyCtx) {
        throw new UnauthorizedException('Недійсний або відкликаний заголовок X-Api-Key.');
      }

      this.tenantContext.setCompanyId(apiKeyCtx.companyId);
      request.user = {
        id: `apikey:${apiKeyCtx.keyId}`,
        email: `apikey+${apiKeyCtx.keyId.slice(0, 8)}@nextops.local`,
        role: 'API_CLIENT',
        companyId: apiKeyCtx.companyId,
        scopes: apiKeyCtx.scopes,
      };
      return true;
    }

    const result = await super.canActivate(context);
    return Boolean(result);
  }

  handleRequest<TUser = JwtPayloadUser>(err: unknown, user: TUser | false): TUser {
    if (err || !user) {
      if (err instanceof Error) {
        throw err;
      }
      throw new UnauthorizedException('Доступ заблоковано. Необхідно надати валідний JWT-токен або X-Api-Key.');
    }

    const typedUser = user as unknown as JwtPayloadUser;
    if (typedUser.companyId) {
      this.tenantContext.setCompanyId(typedUser.companyId);
    }

    return user;
  }
}
