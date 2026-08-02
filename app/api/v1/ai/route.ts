import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Точний імпорт синглтону з маленької літери
import { auth } from "@/lib/auth"; // Точний імпорт системи авторизації Auth.js v5
import { AiOrchestratorServer } from "@/lib/servers/AiOrchestratorServer"; // Наше нове інтернет-ШІ ядро
import { GoogleSearchServer } from "@/lib/servers/GoogleSearchServer"; // Підключаємо наш пошуковий сервер

// Перемикаємо маршрут в стабільний режим Node.js без статичного кешування Next.js 15+
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Суворий інженерний інтерфейс для повідомлень чату ШІ
interface ChatMessagePayload {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    // 1. БЕЗПЕКА: Перевіряємо сесію користувача через конфіг
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "401 Unauthorized" }, { status: 401 });
    }

    // 2. ПАРСИНГ: Отримуємо повідомлення та ID проекту від Вікна №1
    const bodyData = await req.json().catch(() => ({}));
    const messages = bodyData.messages as ChatMessagePayload[] | undefined;
    const projectId = bodyData.projectId as string | undefined;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Поле 'messages' є обов'язковим непустим масивом." }, { status: 400 });
    }

    // 3. ЗЧИТУВАННЯ БД: Шукаємо налаштування ШІ-агента з моделі Project у MongoDB Atlas
    let agentDescription = "Стандартний системний помічник NextOps Engine.";
    let agentTitle = "Autonomous AI Agent";

    if (projectId) {
      // Приведення типу до unknown -> будь-який об'єкт, щоб гарантувати виклик нашого кастомного Mock-методу
      const projectModel = prisma.project as unknown as {
        findFirst: (args: { where: { id: string; userId: string } }) => Promise<{ name: string; status: string } | null>;
      };

      const project = await projectModel.findFirst({
        where: {
          id: projectId,
          userId: session.user.id, // Сувора ізоляція: тільки свої проекти розробника
        },
      });

      if (project) {
        // Синхронізуємо назви полів з нашою Mock-базою даних (name замість title, status замість description)
        agentTitle = project.name;
        agentDescription = `Статус ноди в NoSQL кластері: ${project.status}. Інструкція розробника успішно підтягнута.`;
      }
    }

    // ====================================================================
    // 🔥 НОВИЙ ШАР AUTOMATED INTENT RAG (Інтернет-пошук для бота)
    // ====================================================================
    const userLastMessage = messages[messages.length - 1]?.content || "";

    // Тригер пошукових намірів: реагує на ключові слова про інтернет, новини, курси, погоду
    const needsInternet = /пошук|найди|знайди|інтернет|news|search|курс|погода|свіжі|актуальні/i.test(userLastMessage);

    if (needsInternet) {
      console.log(` [RAG Engine]: Виявлено запит на інтернет-пошук: "${userLastMessage}"`);
      
      // Викликаємо наш виправлений безпомилковий сервер пошуку DuckDuckGo API
      const webSearchResults = await GoogleSearchServer.searchInternet(userLastMessage);

      // Ін'єктуємо отриманий контекст на самий початок масиву як системне застереження ШІ
      messages.unshift({
        role: "system",
        content: `ДАНІ З ЖИВОГО ІНТЕРНЕТ-ПОШУКУ (АКТУАЛЬНО НА РЕАЛЬНИЙ ЧАС):\n${webSearchResults}\n\nВикористовуй ці факти для формування точної, свіжої та аргументованої відповіді клієнту.`
      });
    }

    // 4. ЗАПУСК ШІ-ОРКЕСТРАТОРА: Передаємо керування нашому автономному серверному ядру
    const sseStream = await AiOrchestratorServer.executeWorkflow(
      messages,
      agentTitle,
      agentDescription
    ) as ReadableStream<Uint8Array>;

    // 5. ПРЕМІУМ ПОТІК (WEB STREAM): Повертаємо Event-Stream заголовки для преміального UX
    return new Response(sseStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no", // Вимикає проміжне проксі-кешування на серверах Vercel/Nginx
      },
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error("  Критична помилка Потокового Шлюзу ШІ:", err.message);
    return NextResponse.json({ error: "Внутрішня помилка сервера при генерації потоку" }, { status: 500 });
  }
}
