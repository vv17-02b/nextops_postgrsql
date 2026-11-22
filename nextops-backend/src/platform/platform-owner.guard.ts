import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

interface AuthenticatedUserRequest {
  user?: {
    email?: string | null;
    emailVerified?: boolean;
  };
}

@Injectable()
export class PlatformOwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedUserRequest>();
    const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
    const userEmail = request.user?.email?.trim().toLowerCase();

    if (!bootstrapEmail || !userEmail || userEmail !== bootstrapEmail) {
      throw new ForbiddenException('Доступ дозволено лише власнику SaaS-платформи.');
    }

    if (request.user?.emailVerified === false) {
      throw new ForbiddenException('Підтвердіть email власника SaaS-платформи.');
    }

    return true;
  }
}
