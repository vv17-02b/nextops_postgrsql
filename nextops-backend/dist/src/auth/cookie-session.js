"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cookieSecure = exports.SESSION_MAX_AGE_MS = exports.CSRF_HEADER = exports.CSRF_COOKIE = exports.SESSION_COOKIE = void 0;
exports.sessionCookieOptions = sessionCookieOptions;
exports.clearedSessionCookieOptions = clearedSessionCookieOptions;
exports.csrfCookieOptions = csrfCookieOptions;
exports.readCookie = readCookie;
exports.SESSION_COOKIE = 'nextops_session';
exports.CSRF_COOKIE = 'nextops_csrf';
exports.CSRF_HEADER = 'x-csrf-token';
exports.SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const sameSiteValue = (process.env.AUTH_COOKIE_SAME_SITE ?? 'lax').toLowerCase();
if (!['strict', 'lax', 'none'].includes(sameSiteValue)) {
    throw new Error('AUTH_COOKIE_SAME_SITE must be Strict, Lax, or None.');
}
exports.cookieSecure = process.env.NODE_ENV === 'production'
    || process.env.AUTH_COOKIE_SECURE === 'true'
    || sameSiteValue === 'none';
if (sameSiteValue === 'none' && !exports.cookieSecure) {
    throw new Error('SameSite=None cookies require AUTH_COOKIE_SECURE=true.');
}
const cookieDomain = process.env.AUTH_COOKIE_DOMAIN || undefined;
const sameSite = sameSiteValue;
function sessionCookieOptions() {
    return {
        httpOnly: true,
        secure: exports.cookieSecure,
        sameSite,
        path: '/',
        domain: cookieDomain,
        maxAge: exports.SESSION_MAX_AGE_MS,
    };
}
function clearedSessionCookieOptions() {
    const { maxAge: _maxAge, ...options } = sessionCookieOptions();
    return options;
}
function csrfCookieOptions() {
    return {
        httpOnly: false,
        secure: exports.cookieSecure,
        sameSite,
        path: '/',
        domain: cookieDomain,
    };
}
function readCookie(request, name) {
    const cookieHeader = request.headers.cookie;
    if (!cookieHeader)
        return undefined;
    for (const part of cookieHeader.split(';')) {
        const separator = part.indexOf('=');
        if (separator < 0 || part.slice(0, separator).trim() !== name)
            continue;
        try {
            return decodeURIComponent(part.slice(separator + 1).trim());
        }
        catch {
            return undefined;
        }
    }
    return undefined;
}
//# sourceMappingURL=cookie-session.js.map