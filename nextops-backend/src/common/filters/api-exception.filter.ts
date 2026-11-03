import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ApiError {
  field: string;
  messages: string[];
}

interface ErrorBody {
  statusCode: number;
  message: string;
  errorCode: string;
  timestamp: string;
  errors: ApiError[];
}

function getPrismaErrorCode(exception: unknown): string | undefined {
  if (typeof exception !== 'object' || exception === null || !('code' in exception)) {
    return undefined;
  }

  const code = exception.code;
  return typeof code === 'string' ? code : undefined;
}

function getMappedStatus(code: string | undefined): number {
  switch (code) {
    case 'P2002':
      return HttpStatus.CONFLICT;
    case 'P2003':
    case 'P2011':
    case 'P2012':
      return HttpStatus.BAD_REQUEST;
    case 'P2025':
      return HttpStatus.NOT_FOUND;
    case 'P1001':
    case 'P1002':
      return HttpStatus.SERVICE_UNAVAILABLE;
    default:
      return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}

function getSafeMessage(statusCode: number): string {
  if (statusCode === HttpStatus.BAD_REQUEST) return 'The request is invalid.';
  if (statusCode === HttpStatus.UNAUTHORIZED) return 'Authentication is required.';
  if (statusCode === HttpStatus.FORBIDDEN) return 'The request is not allowed.';
  if (statusCode === HttpStatus.NOT_FOUND) return 'The requested resource was not found.';
  if (statusCode === HttpStatus.CONFLICT) return 'The request conflicts with existing data.';
  if (statusCode === HttpStatus.SERVICE_UNAVAILABLE) return 'A required service is unavailable.';
  if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) return 'An unexpected error occurred.';
  return 'The request could not be completed.';
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const prismaCode = getPrismaErrorCode(exception);
    const statusCode = exception instanceof HttpException
      ? exception.getStatus()
      : getMappedStatus(prismaCode);
    const exceptionResponse = exception instanceof HttpException
      ? exception.getResponse()
      : null;
    const responseObject = typeof exceptionResponse === 'object' && exceptionResponse !== null
      ? exceptionResponse as Record<string, unknown>
      : {};
    const errors = Array.isArray(responseObject.errors)
      ? responseObject.errors as ApiError[]
      : [];
    const message = errors.length > 0
      ? 'Request validation failed.'
      : getSafeMessage(statusCode);
    const errorCode = typeof responseObject.errorCode === 'string'
      ? responseObject.errorCode
      : prismaCode
        ? `DATABASE_${prismaCode}`
        : statusCode === HttpStatus.BAD_REQUEST && errors.length > 0
          ? 'VALIDATION_ERROR'
          : `HTTP_${statusCode}`;
    const body: ErrorBody = {
      statusCode,
      message,
      errorCode,
      timestamp: new Date().toISOString(),
      errors,
    };

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.path} failed`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(statusCode).json(body);
  }
}
