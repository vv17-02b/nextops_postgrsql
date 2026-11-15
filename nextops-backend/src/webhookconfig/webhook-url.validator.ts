import { BadRequestException } from '@nestjs/common';
import { isIP } from 'node:net';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
  'postgres',
  'redis',
  'backend',
  'frontend',
  'metadata.google.internal',
]);

function isPrivateOrLoopbackIp(ip: string): boolean {
  const normalized = ip.replace(/^\[|\]$/g, '').toLowerCase();
  if (normalized === '::1' || normalized === '::' || normalized.startsWith('fe80:') || normalized.startsWith('fc') || normalized.startsWith('fd')) {
    return true;
  }

  const ipv4Mapped = normalized.startsWith('::ffff:') ? normalized.slice(7) : normalized;
  const parts = ipv4Mapped.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return false;
  }

  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true; // Cloud metadata (AWS/GCP/Azure)
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // Carrier-grade NAT
  return false;
}

export function assertSafeWebhookUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new BadRequestException('Некоректний формат URL вебхука.');
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const allowedProtocols = isProduction ? ['https:'] : ['https:', 'http:'];
  if (!allowedProtocols.includes(parsed.protocol)) {
    throw new BadRequestException(
      isProduction
        ? 'У production-режимі вебхуки дозволені лише за протоколом HTTPS.'
        : 'Вебхук повинен використовувати протокол HTTP або HTTPS.',
    );
  }

  if (parsed.username || parsed.password) {
    throw new BadRequestException('URL вебхука не повинен містити логін або пароль.');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    (isIP(hostname) !== 0 && isPrivateOrLoopbackIp(hostname))
  ) {
    throw new BadRequestException(
      'Заборонено вказувати локальні або приватні мережеві адреси для вебхуків (захист від SSRF).',
    );
  }

  return parsed.toString();
}
