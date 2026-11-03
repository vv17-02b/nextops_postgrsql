import { Logger } from '@nestjs/common';
import { randomBytes } from 'node:crypto';

const configuredJwtSecret = process.env.JWT_SECRET;
const hasValidJwtSecret = Boolean(configuredJwtSecret && configuredJwtSecret.length >= 32);

if (!hasValidJwtSecret && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must contain at least 32 characters before starting the API.');
}

export const jwtSecret: string = hasValidJwtSecret
  ? (configuredJwtSecret as string)
  : randomBytes(48).toString('base64url');

if (!hasValidJwtSecret) {
  new Logger('AuthModule').warn('Using an ephemeral JWT secret for development; configure a stable JWT_SECRET.');
}
