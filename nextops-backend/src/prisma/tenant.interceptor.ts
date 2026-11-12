import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import type { Request } from 'express';
import { TenantContext } from './tenant-context';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    companyId?: string;
  };
}

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(
    @Inject(TenantContext)
    private readonly tenantContext: TenantContext,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const companyId = request.user?.companyId;

    if (!companyId) {
      return next.handle();
    }

    return new Observable((subscriber) => {
      this.tenantContext.runWithCompany(companyId, () => {
        next.handle().subscribe({
          next: (val) => subscriber.next(val),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
