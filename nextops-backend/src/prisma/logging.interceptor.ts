import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from './prisma.service';
import type { Request, Response } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
    companyId?: string;
  };
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor<unknown, unknown> {
  private readonly logger = new Logger(LoggingInterceptor.name);
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler<unknown>): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<AuthenticatedRequest>();
    const response = httpContext.getResponse<Response>();

    const method = request.method;
    const endpoint = request.path;
    const startTime = performance.now();

    if (endpoint.includes('/api/apihistory') || endpoint.includes('/apihistory')) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const userId = request.user?.id;
          const companyId = request.user?.companyId;
          if (!userId || !companyId) return;

          const durationMs = Math.round(performance.now() - startTime);
          const statusCode = response.statusCode;

          void this.prisma.runSystemQuery(() =>
            this.prisma.apiHistory.create({
              data: {
                endpoint: endpoint || '/unknown',
                method: method || 'GET',
                statusCode: statusCode || 200,
                durationMs: durationMs || 0,
                userId,
                companyId,
              },
            }),
          ).catch((error: unknown) => {
            this.logger.error('Failed to persist API request history.', error instanceof Error ? error.stack : undefined);
          });
        },
        error: (error: unknown) => {
          const userId = request.user?.id;
          const companyId = request.user?.companyId;
          if (!userId || !companyId) return;

          const durationMs = Math.round(performance.now() - startTime);
          const statusCode =
            typeof error === 'object' &&
            error !== null &&
            'status' in error &&
            typeof error.status === 'number'
              ? error.status
              : 500;

          void this.prisma.runSystemQuery(() =>
            this.prisma.apiHistory.create({
              data: {
                endpoint: endpoint || '/unknown',
                method: method || 'GET',
                statusCode,
                durationMs,
                userId,
                companyId,
              },
            }),
          ).catch((dbErr: unknown) => {
            this.logger.error('Failed to persist API request history after request error.', dbErr instanceof Error ? dbErr.stack : undefined);
          });
        },
      }),
    );
  }
}
