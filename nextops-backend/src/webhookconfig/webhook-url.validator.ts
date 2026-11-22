import { BadRequestException } from '@nestjs/common';
import { lookup } from 'node:dns/promises';
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
  if (
    normalized === '::1' ||
    normalized === '::' ||
    normalized.startsWith('fe80:') ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd')
  ) {
    return true;
  }

  const ipv4Mapped = normalized.startsWith('::ffff:') ? normalized.slice(7) : normalized;
  const parts = ipv4Mapped.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return false;
  }

  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

export async function assertSafeWebhookUrl(rawUrl: string): Promise<string> {
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
    hostname.endsWith('.internal')
  ) {
    throw new BadRequestException(
      'Заборонено вказувати локальні або приватні мережеві адреси для вебхуків (захист від SSRF).',
    );
  }

  const strippedHost = hostname.replace(/^\[|\]$/g, '');
  if (isIP(strippedHost) !== 0) {
    if (isPrivateOrLoopbackIp(strippedHost)) {
      throw new BadRequestException(
        'Заборонено вказувати локальні або приватні IP-адреси для вебхуків (захист від SSRF).',
      );
    }
    return parsed.toString();
  }

  try {
    const resolved = await lookup(strippedHost, { all: true, verbatim: true });
    if (resolved.length === 0 || resolved.some((entry) => isPrivateOrLoopbackIp(entry.address))) {
      throw new BadRequestException(
        'Домен вебхука вказує на приватну або локальну IP-адресу (захист від DNS Rebinding SSRF).',
      );
    }
  } catch (err) {
    if (err instanceof BadRequestException) {
      throw err;
    }
    throw new BadRequestException('Не вдалося перевірити DNS-запис домену вебхука.');
  }

  return parsed.toString();
}
