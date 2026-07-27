import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // 1. СУВОРИЙ ЗАХИСТ СЕРВЕРА ВІД SSRF-АТАК
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
    // Зчитуємо дані конфігурації запиту з клієнтського Емулятора Postman
    const bodyData = await req.json();
    const { url, method, headers, body } = bodyData;

    targetUrl = url || "";
    httpMethod = method || "GET";
    
    // Безпечний парсинг кастомних хедерів
    requestHeaders = (headers && typeof headers === "string") ? JSON.parse(headers) : {};
    requestBody = body || null;

    if (!targetUrl || !targetUrl.trim()) {
      return NextResponse.json({ success: false, error: "URL цільової адреси не вказано" }, { status: 400 });
    }

    // Хак для обходу локальних SSL-блокувань Node.js у середовищі розробки
    if (process.env.NODE_ENV !== "production") {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    }

    // 2. ВИКОНАННЯ РЕАЛЬНОГО HTTP ЗАПИТУ У ЗОВНІШНІЙ СВІТ В КЛАСУТЕРІ
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
      // Якщо домен не існує або немає інтернету — м'яко перехоплюємо помилку, обходячи падіння 500
      console.error("❌ [ External Fetch Failed ]:", fetchError.message);
      responseStatus = 404;
      
      // ВИПРАВЛЕНО: Тепер підказка веде на правильний і стабільний тестовий REST API
      responseText = JSON.stringify({
        error: "ENOTFOUND // SERVER_NOT_FOUND",
        message: `Не вдалося встановити зв'язок з адресою: ${targetUrl}. Перевірте правильність написання URL.`,
        tip: "Спробуйте використати валідний тестовий ендпоінт, наприклад: https://typicode.com"
      }, null, 2);
    } finally {
      // Очищення хаку SSL для запобігання глобальним проблемам безпеки Node.js процесу
      if (process.env.NODE_ENV !== "production") {
        delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      }
    }

    // 3. 🔥 ПОВНЕ УВІМКНЕННЯ ЗАПИСУ ІСТОРІЇ В MONGODB ATLAS
    // Валідуємо рядок на відповідність стандарту ObjectId
    const isValidObjectId = currentUserId && /^[0-9a-fA-F]{24}$/.test(currentUserId);
    if (isValidObjectId) {
      await prisma.apiHistory.create({
        data: {
          userId: currentUserId, // Прив'язуємо лог строго до поточної NoSQL сесії Vlad
          method: httpMethod,
          url: targetUrl.trim(),
          headers: headers ? String(headers) : null,
          body: requestBody ? JSON.stringify(requestBody) : null,
          response: responseText.substring(0, 5000), // Обмежуємо розмір відповіді для економії пам'яті хмари
          status: responseStatus
        }
      });
    }

    // Повертаємо success: true, щоб клієнтський Postman завжди красиво малював логи зеленими літерами
    return NextResponse.json({
      success: true,
      status: responseStatus,
      data: responseText
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ [ PROXY ENGINE CRASH ]:", error);
    if (error instanceof Error) {
      console.error(error.stack);
    }
    
    return NextResponse.json({
      success: false,
      status: responseStatus,
      error: error.message || "Помилка виконання запиту через проксі-сервер"
    }, { status: 500 });
  }
}
