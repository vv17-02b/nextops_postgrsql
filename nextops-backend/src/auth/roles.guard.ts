import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ROLES_KEY, type AppRole } from './roles.decorator';
import { IS_PUBLIC_KEY } from './public.decorator';

interface AuthenticatedRequest extends Request {
  user?: { role?: string };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const role = request.user?.role;
    const allowedRoles = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (allowedRoles) {
      if (role && allowedRoles.includes(role as AppRole)) return true;
      throw new ForbiddenException('Your role does not allow this action.');
    }

    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return true;
    if (role === 'OWNER' || role === 'ADMIN' || role === 'MEMBER') return true;
    throw new ForbiddenException('Your role does not allow this action.');
  }
}
