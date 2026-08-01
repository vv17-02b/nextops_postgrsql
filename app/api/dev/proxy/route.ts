import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized: Доступ дозволено тільки інженерам Хабу",
      },
      { status: 401 },
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

    if (payload.headers) {
      try {
        requestHeaders =
          typeof payload.headers === "string"
            ? JSON.parse(payload.headers)
            : payload.headers;
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid headers JSON format",
          },
          { status: 400 },
        );
      }
    }

    requestBody = payload.body ?? null;

    if (!targetUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "URL цільової адреси не вказано",
        },
        { status: 400 },
      );
    }

    if (!isValidUrl(targetUrl)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Некоректний URL. Використовуйте повний http:// або https:// адрес",
        },
        { status: 400 },
      );
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 15000);

    try {
      const externalResponse = await fetch(targetUrl, {
        method: httpMethod,
        headers: {
          Accept: "application/json",
          ...requestHeaders,
        },
        body:
          httpMethod !== "GET" && httpMethod !== "HEAD" && requestBody !== null
            ? JSON.stringify(requestBody)
            : undefined,
        signal: controller.signal,
      });

      responseStatus = externalResponse.status;
      responseText = await externalResponse.text();
    } catch (error: any) {
      console.error("❌ [PROXY FETCH ERROR]");
      console.error(error);

      const cause = error?.cause;
      responseStatus = 502;
      responseText = JSON.stringify(
        {
          error: "EXTERNAL_REQUEST_FAILED",
          message:
            "Не вдалося виконати зовнішній HTTP-запит через proxy engine.",
          details: {
            name: error?.name || null,
            message: error?.message || null,
            code: cause?.code || null,
            reason: cause?.message || null,
          },
          target: targetUrl,
        },
        null,
        2,
      );
    } finally {
      clearTimeout(timeout);
    }

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(currentUserId);

    if (isObjectId) {
      // ГАРАНТОВАНИЙ ФІКС ТИПІЗАЦІЇ: Мапимо метод та приводимо до потрібного литералу
      const mappedMethod = (httpMethod === "POST" ? "ARTICLE" : "FEEDBACK") as
        | "ARTICLE"
        | "FEEDBACK";

      await prisma.apiHistory.create({
        data: {
          method: mappedMethod,
          url: targetUrl,
          response: responseText.substring(0, 5000),
          headers: JSON.stringify(requestHeaders),
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
    console.error("❌ [PROXY ENGINE CRASH]", error);

    return NextResponse.json(
      {
        success: false,
        status: responseStatus,
        error: error?.message || "Помилка виконання proxy engine",
      },
      { status: 500 },
    );
  }
}
