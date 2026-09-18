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

    return next.handle().pipe(
      tap(async () => {
        const endTime = performance.now();
        const durationMs = Math.round(endTime - startTime);
        const statusCode = response.statusCode;

        // 🌟 СУВОРИЙ ФІКС: Ігноруємо ТІЛЬКИ прямі запити на отримання/маніпуляцію логами
        // Все інше — логіни, реєстрації, товари — ЗАПИСУЄМО БЕЗ ВИНЯТКІВ
        if (endpoint === '/api/apihistory' || endpoint === '/apihistory') {
          return;
        }

        try {
          await this.prisma.$runCommandRaw({
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
          });
        } catch (error) {
          console.error(' [LoggingInterceptor Error]:', error);
        }
      })
    );
  }
}
