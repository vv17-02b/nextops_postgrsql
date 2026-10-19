import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from './prisma.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const response = httpContext.getResponse();

    const method = request.method;
    const endpoint = request.url;
    const startTime = performance.now();

    //  СУВОРИЙ ФІКС ЦИКЛУ: Перевіряємо через .includes(), щоб відсікти будь-які query-параметри логів
    if (endpoint.includes('/api/apihistory') || endpoint.includes('/apihistory')) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const endTime = performance.now();
          const durationMs = Math.round(endTime - startTime);
          const statusCode = response.statusCode;

          // Запускаємо асинхронний запис у фоні безпечно для RxJS
          this.prisma.$runCommandRaw({
            insert: 'ApiHistory',
            documents: [
              {
                endpoint: endpoint || '/unknown',
                method: method || 'GET',
                statusCode: statusCode || 200,
                durationMs: durationMs || 0,
                createdAt: new Date(),
              },
            ],
          }).catch((error) => {
            console.error(' [LoggingInterceptor Async Error]:', error);
          });
        },
        error: (error) => {
          const endTime = performance.now();
          const durationMs = Math.round(endTime - startTime);
          const statusCode = error.status || 500;

          this.prisma.$runCommandRaw({
            insert: 'ApiHistory',
            documents: [
              {
                endpoint: endpoint || '/unknown',
                method: method || 'GET',
                statusCode: statusCode,
                durationMs: durationMs,
                createdAt: new Date(),
              },
            ],
          }).catch((dbErr) => {
            console.error(' [LoggingInterceptor Error on Crash]:', dbErr);
          });
        }
      })
    );
  }
}
