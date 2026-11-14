import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

export const REQUIRED_SCOPE_KEY = 'requiredApiScope';
export const RequireScope = (scope: string) => SetMetadata(REQUIRED_SCOPE_KEY, scope);

interface RequestWithScopedUser extends Request {
  user?: {
    id: string;
    role?: string;
    companyId?: string;
    scopes?: string[];
  };
}

@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(
    @Inject(Reflector)
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') return true;

    const requiredScope = this.reflector.getAllAndOverride<string | undefined>(REQUIRED_SCOPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredScope) return true;

    const request = context.switchToHttp().getRequest<RequestWithScopedUser>();
    const user = request.user;
    if (!user) return false;

    if (user.role !== 'API_CLIENT') {
      return true;
    }

    const scopes = Array.isArray(user.scopes) ? user.scopes : [];
    if (!scopes.includes(requiredScope)) {
      throw new ForbiddenException(
        `Ваш API-ключ не має необхідного дозволу "${requiredScope}".`,
      );
    }

    return true;
  }
}
