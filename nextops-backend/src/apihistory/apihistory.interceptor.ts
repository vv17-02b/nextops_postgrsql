import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
    companyId?: string;
  };
}

interface HttpErrorShape {
  status?: number;
  getStatus?: () => number;
}

@Injectable()
export class ApiHistoryInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ApiHistoryInterceptor.name);

  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithUser>();
    const response = http.getResponse<Response>();

    const method = request.method.toUpperCase();
    const rawUrl = request.originalUrl || request.url || '';
    const endpoint = rawUrl.split('?')[0] ?? '';
    const startedAt = Date.now();

    if (
      endpoint.startsWith('/api/apihistory') ||
      endpoint.startsWith('/api/health') ||
      endpoint.startsWith('/api/auth/csrf')
    ) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const statusCode = response.statusCode || 200;
          const isMutation = method === 'POST' || method === 'PATCH' || method === 'DELETE';
          if (isMutation || statusCode >= 400) {
            this.recordAudit(request, endpoint, method, statusCode, Date.now() - startedAt);
          }
        },
        error: (err: unknown) => {
          const statusCode = this.extractStatusCode(err);
          this.recordAudit(request, endpoint, method, statusCode, Date.now() - startedAt);
        },
      }),
    );
  }

  private extractStatusCode(err: unknown): number {
    if (typeof err === 'object' && err !== null) {
      const candidate = err as HttpErrorShape;
      if (typeof candidate.getStatus === 'function') {
        return candidate.getStatus();
      }
      if (typeof candidate.status === 'number') {
        return candidate.status;
      }
    }
    return 500;
  }

  private recordAudit(
    request: RequestWithUser,
    endpoint: string,
    method: string,
    statusCode: number,
    durationMs: number,
  ): void {
    const userId = request.user?.id;
    const companyId = request.user?.companyId;

    if (!userId || !companyId) {
      return;
    }

    void this.prisma
      .runSystemQuery(() =>
        this.prisma.apiHistory.create({
          data: {
            userId,
            companyId,
            endpoint: endpoint.slice(0, 2048),
            method: method.slice(0, 16),
            statusCode,
            durationMs: Math.max(0, Math.round(durationMs)),
          },
        }),
      )
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unknown audit write error';
        this.logger.warn(`Failed to write ApiHistory audit log: ${message}`);
      });
  }
}
