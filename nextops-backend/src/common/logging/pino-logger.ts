import type { LoggerService } from '@nestjs/common';
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: [
      'password',
      'passwordHash',
      'token',
      'accessToken',
      'refreshToken',
      'secret',
      'webhookSecret',
      'cardNumber',
      '*.password',
      '*.passwordHash',
      '*.token',
      '*.accessToken',
      '*.refreshToken',
      '*.secret',
      '*.webhookSecret',
      '*.cardNumber',
      'req.headers.authorization',
      'req.headers.cookie',
      'headers.authorization',
      'headers.cookie',
    ],
    censor: '[REDACTED]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

function messageText(message: unknown): string {
  return typeof message === 'string' ? message : 'NestJS structured log event';
}

export class PinoLogger implements LoggerService {
  log(message: unknown, ...optionalParams: unknown[]): void {
    logger.info({ context: optionalParams[0], detail: typeof message === 'string' ? undefined : message }, messageText(message));
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    logger.error({ context: optionalParams[1], detail: optionalParams[0] }, messageText(message));
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    logger.warn({ context: optionalParams[0], detail: typeof message === 'string' ? undefined : message }, messageText(message));
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    logger.debug({ context: optionalParams[0], detail: typeof message === 'string' ? undefined : message }, messageText(message));
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    logger.trace({ context: optionalParams[0], detail: typeof message === 'string' ? undefined : message }, messageText(message));
  }
}
