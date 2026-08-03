import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Валідація безпеки протоколів
function isValidUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// 🛡️ ФУНКЦІЯ БЕЗПЕКИ: Маскування токенів, паролів та API-ключів перед записом у NoSQL
function sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
  const sanitized = { ...headers };
  const sensitiveKeys = ["authorization", "cookie", "x-api-key", "api-key", "password", "secret", "token"];
  
  for (const key in sanitized) {
    if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = "[REDACTED_FOR_SECURITY]";
    }
  }
  return sanitized;
}

export async function POST(req: NextRequest) {
  const session = await auth();

  // 1. Серверний захист: Доступ тільки авторизованим інженерам
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Доступ дозволено тільки інженерам Хабу" },
      { status: 401 }
    );
  }

  const currentUserId = session.user.id;
  let targetUrl = "";
  let httpMethod = "GET";
  let requestHeaders: Record<string, string> = {};
  let requestBody: unknown = null;
  let responseText = "";
  let responseStatus = 500;

  try {
    const payload = await req.json();

    targetUrl = String(payload.url || "").trim();
    httpMethod = String(payload.method || "GET").toUpperCase();

    // Парсинг та валідація заголовків
    if (payload.headers) {
      try {
        requestHeaders = typeof payload.headers === "string" ? JSON.parse(payload.headers) : payload.headers;
      } catch {
        return NextResponse.json({ success: false, error: "Invalid headers JSON format" }, { status: 400 });
      }
    }

    requestBody = payload.body ?? null;

    if (!targetUrl) {
      return NextResponse.json({ success: false, error: "URL цільової адреси не вказано" }, { status: 400 });
    }

    if (!isValidUrl(targetUrl)) {
      return NextResponse.json({ success: false, error: "Некоректний URL. Використовуйте повний http:// або https://" }, { status: 400 });
    }

    // Захист сервера від зависання: 15-секундний жорсткий таймаут
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const externalResponse = await fetch(targetUrl, {
        method: httpMethod,
        headers: {
          "Accept": "application/json",
          ...requestHeaders,
        },
        body: httpMethod !== "GET" && httpMethod !== "HEAD" && requestBody !== null ? JSON.stringify(requestBody) : undefined,
        signal: controller.signal,
      });

      responseStatus = externalResponse.status;
      responseText = await externalResponse.text();
    } catch (error: any) {
      console.error("❌ [PROXY FETCH ERROR]:", error?.message);
      responseStatus = 502;
      responseText = JSON.stringify({
        error: "EXTERNAL_REQUEST_FAILED",
        message: "Не вдалося виконати зовнішній HTTP-запит через proxy engine.",
        details: error?.message || null,
        target: targetUrl,
      });
    } finally {
      clearTimeout(timeout);
    }

    // 2. ОПТИМІЗАЦІЯ ЗАПИСУ ІСТОРІЇ (Вікно №3)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(currentUserId);
    if (isObjectId) {
      const safeHeaders = sanitizeHeaders(requestHeaders);
      const optimizedResponse = responseText.length > 1000 ? responseText.substring(0, 1000) + "... [TRUNCATED]" : responseText;

      await prisma.apiHistory.create({
        data: {
          userId: currentUserId,
          method: httpMethod,    // Зберігає реальні GET, POST, PUT як String
          url: targetUrl,
          response: optimizedResponse,
          headers: JSON.stringify(safeHeaders),
          status: responseStatus,
        },
      });
    }

    return NextResponse.json({
      success: true,
      status: responseStatus,
      data: responseText,
    });

  } catch (error: any) {
    console.error("🚨 [PROXY ENGINE CRASH]:", error);
    return NextResponse.json(
      { success: false, status: responseStatus, error: error?.message || "Помилка виконання proxy engine" },
      { status: 500 }
    );
  }
}
