import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from './prisma.service';
export declare class LoggingInterceptor implements NestInterceptor<unknown, unknown> {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    intercept(context: ExecutionContext, next: CallHandler<unknown>): Observable<unknown>;
}
