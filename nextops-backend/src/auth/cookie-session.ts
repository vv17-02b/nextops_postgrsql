import type { CookieOptions, Request } from 'express';

export const SESSION_COOKIE = 'nextops_session';
export const CSRF_COOKIE = 'nextops_csrf';
export const CSRF_HEADER = 'x-csrf-token';
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const sameSiteValue = (process.env.AUTH_COOKIE_SAME_SITE ?? 'lax').toLowerCase();
if (!['strict', 'lax', 'none'].includes(sameSiteValue)) {
  throw new Error('AUTH_COOKIE_SAME_SITE must be Strict, Lax, or None.');
}

export const cookieSecure = process.env.NODE_ENV === 'production'
  || process.env.AUTH_COOKIE_SECURE === 'true'
  || sameSiteValue === 'none';

if (sameSiteValue === 'none' && !cookieSecure) {
  throw new Error('SameSite=None cookies require AUTH_COOKIE_SECURE=true.');
}

const cookieDomain = process.env.AUTH_COOKIE_DOMAIN || undefined;
const sameSite = sameSiteValue as 'strict' | 'lax' | 'none';

export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: cookieSecure,
    sameSite,
    path: '/',
    domain: cookieDomain,
    maxAge: SESSION_MAX_AGE_MS,
  };
}

export function clearedSessionCookieOptions(): CookieOptions {
  const { maxAge: _maxAge, ...options } = sessionCookieOptions();
  return options;
}

export function csrfCookieOptions(): CookieOptions {
  return {
    httpOnly: false,
    secure: cookieSecure,
    sameSite,
    path: '/',
    domain: cookieDomain,
  };
}

export function readCookie(request: Request, name: string): string | undefined {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0 || part.slice(0, separator).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return undefined;
    }
  }
  return undefined;
}
