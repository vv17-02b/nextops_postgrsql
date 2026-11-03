let csrfTokenInMemory: string | null = null;
let csrfTokenRequest: Promise<string> | null = null;

let tabRequestCounter = 0;
let tabIdempotencySalt: string | null = null;

/**
 * Stable per-tab idempotency key for one request shape. Retrying the same
 * mutating call within this tab reuses the key, letting Redis deduplicate it;
 * a fresh page load starts a new tab scope.
 */
function getOrCreateTabIdempotencyKey(method: string, requestUrl: string): string {
  if (!tabIdempotencySalt) {
    tabIdempotencySalt =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
  }
  tabRequestCounter += 1;
  const normalizedUrl = requestUrl.split("?")[0] ?? requestUrl;
  const raw = `${method}:${normalizedUrl}:${tabRequestCounter}`;
  let hash = 0;
  for (let index = 0; index < raw.length; index += 1) {
    hash = (hash * 31 + raw.charCodeAt(index)) | 0;
  }
  const key = `tab-${Math.abs(hash).toString(36)}`;
  return key.length >= 8 ? key : key.padEnd(8, "0");
}

export function getApiUrl(endpoint: string): string {
  if (/^https?:\/\//i.test(endpoint)) return endpoint;
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return path;
}

export function getApiHeaders(includeJsonContentType = false): Record<string, string> {
  return {
    ...(includeJsonContentType ? { "Content-Type": "application/json" } : {}),
  };
}

function getCsrfCookie(): string | null {
  if (typeof document === "undefined") return null;
  const value = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("nextops_csrf="))
    ?.slice("nextops_csrf=".length);
  return value ? decodeURIComponent(value) : null;
}

async function ensureCsrfToken(): Promise<string> {
  const csrfCookie = getCsrfCookie();
  if (csrfCookie) return csrfCookie;
  if (csrfTokenInMemory) return csrfTokenInMemory;
  if (!csrfTokenRequest) {
    csrfTokenRequest = (async () => {
      const response = await fetch(getApiUrl("/api/auth/csrf"), { credentials: "include" });
      if (!response.ok) {
        throw new Error(`Could not initialize CSRF protection (HTTP ${response.status}).`);
      }
      const payload: unknown = await response.json();
      if (
        typeof payload !== "object" ||
        payload === null ||
        !("csrfToken" in payload) ||
        typeof payload.csrfToken !== "string"
      ) {
        throw new Error("The API returned an invalid CSRF token.");
      }
      csrfTokenInMemory = payload.csrfToken;
      return csrfTokenInMemory;
    })();
  }
  try {
    return await csrfTokenRequest;
  } finally {
    csrfTokenRequest = null;
  }
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const requestUrl = input instanceof Request ? input.url : input.toString();
  if (typeof window !== "undefined") {
    const targetUrl = new URL(requestUrl, window.location.origin);
    if (targetUrl.origin !== window.location.origin) {
      throw new Error("API requests must use the same origin as the application.");
    }
  }

  const headers = new Headers(init.headers);
  const method = (init.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method) && !headers.has("X-CSRF-Token")) {
    headers.set("X-CSRF-Token", await ensureCsrfToken());
  }
  // Mutating requests get a per-tab idempotency key so interrupted submissions
  // can be safely retried without duplicating writes on idempotent endpoints.
  if (!["GET", "HEAD", "OPTIONS"].includes(method) && !headers.has("Idempotency-Key")) {
    headers.set("Idempotency-Key", getOrCreateTabIdempotencyKey(method, requestUrl));
  }
  const response = await fetch(input, { ...init, headers, credentials: "include" });
  if (
    response.status === 401 &&
    typeof window !== "undefined" &&
    !new URL(requestUrl, window.location.origin).pathname.endsWith("/auth/login")
  ) {
    window.dispatchEvent(new Event("nextops:session-expired"));
  }
  return response;
}
