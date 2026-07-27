import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // 1. ЗАХИСТ СЕРВЕРА
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized: Доступ дозволено тільки інженерам Хабу" }, { status: 401 });
  }

  const currentUserId = session.user.id;

  let targetUrl = "";
  let httpMethod = "GET";
  let requestHeaders: any = {};
  let requestBody: any = null;
  let responseText = "";
  let responseStatus = 500;

  try {
    const bodyData = await req.json();
    const { url, method, headers, body } = bodyData;

    targetUrl = url || "";
    httpMethod = method || "GET";
    
    // Парсинг кастомних хедерів та тіла запиту
    requestHeaders = (headers && typeof headers === "string") ? JSON.parse(headers) : {};
    requestBody = body || null;

    if (!targetUrl || !targetUrl.trim()) {
      return NextResponse.json({ success: false, error: "URL цільової адреси не вказано" }, { status: 400 });
    }

    if (process.env.NODE_ENV !== "production") {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    }

    // 2. ВИКОНАННЯ ДИНАМІЧНОГО HTTP ЗАПИТУ
    try {
      const externalResponse = await fetch(targetUrl, {
        method: httpMethod,
        headers: {
          "Content-Type": "application/json",
          ...requestHeaders
        },
        body: httpMethod !== "GET" && httpMethod !== "HEAD" && requestBody ? JSON.stringify(requestBody) : undefined
      });

      responseStatus = externalResponse.status;
      responseText = await externalResponse.text();

    } catch (fetchError: any) {
      console.error("❌ [ External Fetch Failed ]:", fetchError.message);
      responseStatus = 404;
      
      // ПОВНА ДИНАМІКА: Жодного хардкоду доменів
      responseText = JSON.stringify({
        error: "ENOTFOUND // SERVER_NOT_FOUND",
        message: `Не вдалося встановити зв'язок з адресою: ${targetUrl}. Перевірте мережу або правильність написання URL.`,
        tip: "Переконайтеся, що вказано діючий протокол (http:// або https://) та працездатний хост ресурсу."
      }, null, 2);
    } finally {
      if (process.env.NODE_ENV !== "production") {
        delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      }
    }

    // 3. ЗАПИС У БАЗУ ДАНИХ MONGODB ATLAS
    const isValidObjectId = currentUserId && /^[0-9a-fA-F]{24}$/.test(currentUserId);
    if (isValidObjectId) {
      await prisma.apiHistory.create({
        data: {
          userId: currentUserId,
          method: httpMethod,
          url: targetUrl.trim(),
          headers: headers ? String(headers) : null,
          body: requestBody ? JSON.stringify(requestBody) : null,
          response: responseText.substring(0, 5000), 
          status: responseStatus
        }
      });
    }

    return NextResponse.json({
      success: true,
      status: responseStatus,
      data: responseText
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ [ PROXY ENGINE CRASH ]:", error);
    return NextResponse.json({
      success: false,
      status: responseStatus,
      error: error.message || "Помилка виконання запиту через проксі-сервер"
    }, { status: 500 });
  }
}
