import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Inject,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request, Response } from 'express';
import { PrismaService } from './prisma.service';

interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
    role?: string;
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
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<AuthenticatedRequest>();
    const response = httpContext.getResponse<Response>();

    const method = request.method;
    const endpoint = request.path;
    const startTime = performance.now();

    if (endpoint.includes('/api/apihistory') || endpoint.includes('/apihistory')) {
      return next.handle();
    }

    const persistHistory = (statusCode: number) => {
      const userId = request.user?.id;
      const companyId = request.user?.companyId;
      if (!userId || !companyId || request.user?.role === 'API_CLIENT') {
        return;
      }

      const durationMs = Math.max(0, Math.round(performance.now() - startTime));

      void this.prisma
        .runSystemQuery(() =>
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
        )
        .catch((error: unknown) => {
          this.logger.error(
            'Failed to persist API request history.',
            error instanceof Error ? error.stack : undefined,
          );
        });
    };

    return next.handle().pipe(
      tap({
        next: () => {
          persistHistory(response.statusCode || 200);
        },
        error: (error: unknown) => {
          const statusCode =
            error instanceof HttpException
              ? error.getStatus()
              : typeof error === 'object' &&
                  error !== null &&
                  'status' in error &&
                  typeof error.status === 'number'
                ? error.status
                : 500;

          persistHistory(statusCode);
        },
      }),
    );
  }
}
