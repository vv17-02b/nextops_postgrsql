import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { LoggingInterceptor } from './prisma/logging.interceptor'; 
import { PrismaService } from './prisma/prisma.service';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import type { ValidationError } from 'class-validator';
import { CSRF_COOKIE, CSRF_HEADER, csrfCookieOptions, readCookie, SESSION_COOKIE } from './auth/cookie-session';
import { PinoLogger } from './common/logging/pino-logger';
import type { NextFunction, Request, Response } from 'express';

interface CsrfRequest extends Request {
  csrfToken?: string;
}

function flattenValidationErrors(
  validationErrors: ValidationError[],
  parent = '',
): Array<{ field: string; messages: string[] }> {
  return validationErrors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const current = error.constraints
      ? [{ field, messages: Object.values(error.constraints) }]
      : [];
    return [...current, ...flattenValidationErrors(error.children ?? [], field)];
  });
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  app.useLogger(new PinoLogger());
  
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    transformOptions: { enableImplicitConversion: true },
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    exceptionFactory: (errors) => new BadRequestException({
      message: 'Request validation failed.',
      errorCode: 'VALIDATION_ERROR',
      errors: flattenValidationErrors(errors),
    }),
  }));
  app.useGlobalFilters(new ApiExceptionFilter());

  const allowedOrigins = new Set((process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean));
  const allowLocalDevelopmentOrigin = process.env.NODE_ENV !== 'production';
  app.enableCors({
    origin: (origin, callback) => {
      const isLocalDevelopmentOrigin = allowLocalDevelopmentOrigin
        && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin ?? '');
      callback(null, !origin || allowedOrigins.has(origin) || isLocalDevelopmentOrigin);
    },
    credentials: true,
  });

  const csrfEnabled = process.env.CSRF_ENABLED !== 'false';
  app.use((request: CsrfRequest, response: Response, next: NextFunction) => {
    const csrfCookie = readCookie(request, CSRF_COOKIE);
    if (!csrfCookie) {
      request.csrfToken = randomBytes(32).toString('base64url');
      response.cookie(CSRF_COOKIE, request.csrfToken, csrfCookieOptions());
    }

    if (!csrfEnabled) {
      next();
      return;
    }

    const isUnsafeMethod = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
    const origin = request.get('origin');
    const isLocalDevelopmentOrigin = allowLocalDevelopmentOrigin
      && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin ?? '');
    if (
      isUnsafeMethod
      && (origin || readCookie(request, SESSION_COOKIE))
      && (
        !csrfCookie
        || !origin
        || (!allowedOrigins.has(origin) && !isLocalDevelopmentOrigin)
        || !matchesCsrfToken(csrfCookie, request.header(CSRF_HEADER))
      )
    ) {
      response.status(403).json({
        statusCode: 403,
        message: 'A valid CSRF token and trusted origin are required.',
        errorCode: 'CSRF_VALIDATION_FAILED',
      });
      return;
    }
    next();
  });

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  const prismaService = app.get(PrismaService);
  app.useGlobalInterceptors(new LoggingInterceptor(prismaService));

  const port = Number(process.env.PORT ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  app.enableShutdownHooks();
  await app.listen(port, process.env.HOST ?? '0.0.0.0');
  new PinoLogger().log(`NextOps backend listening on port ${port}`);
}
bootstrap();

function matchesCsrfToken(cookie: string, header?: string): boolean {
  if (!header) return false;
  const cookieBuffer = Buffer.from(cookie);
  const headerBuffer = Buffer.from(header);
  return cookieBuffer.length === headerBuffer.length
    && timingSafeEqual(cookieBuffer, headerBuffer);
}
