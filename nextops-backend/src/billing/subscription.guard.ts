import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { PlanEnforcementService } from './plan-enforcement.service';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

interface RequestWithUser extends Request {
  user?: {
    id: string;
    role: string;
    companyId?: string;
  };
}

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    @Inject(PlanEnforcementService)
    private readonly planEnforcement: PlanEnforcementService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    if (!MUTATING_METHODS.has(request.method.toUpperCase())) {
      return true;
    }

    const companyId = request.user?.companyId;
    if (!companyId) {
      return true;
    }

    const path = request.path ?? '';
    if (path.startsWith('/api/billing') || path.startsWith('/api/auth')) {
      return true;
    }

    await this.planEnforcement.assertActiveSubscription(companyId);
    return true;
  }
}
