import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Точний імпорт синглтону з маленької літери
import { auth } from "@/lib/auth"; // Точний імпорт системи авторизації Auth.js v5
import { AiOrchestratorServer } from "@/lib/servers/AiOrchestratorServer"; // Наше нове інтернет-ШІ ядро

// Перемикаємо маршрут в стабільний режим Node.js без статичного кешування Next.js 15+
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    // 1. БЕЗПЕКА: Перевіряємо сесію користувача через  конфіг
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "401 Unauthorized" }, { status: 401 });
    }

    // 2. ПАРСИНГ: Отримуємо повідомлення та ID проекту від Вікна №1
    const bodyData = await req.json().catch(() => ({}));
    const { messages, projectId } = bodyData;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Поле 'messages' є обов'язковим масивом." }, { status: 400 });
    }

    // 3. ЗЧИТУВАННЯ БД: Шукаємо налаштування ШІ-агента з моделі Project у MongoDB Atlas
    let agentDescription = "Стандартний системний помічник NextOps Engine.";
    let agentTitle = "Autonomous AI Agent";

    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: session.user.id, // Сувора ізоляція: тільки свої проекти розробника
        },
      });

      if (project) {
        agentTitle = project.title;
        agentDescription = project.description || "Інструкція розробника відсутня у базі.";
      }
    }
    // 4. ЗАПУСК ШІ-ОРКЕСТРАТОРА: Передаємо керування нашому автономному серверному ядру
    const sseStream = await AiOrchestratorServer.executeWorkflow(
      messages,
      agentTitle,
      agentDescription
    );

    // 5. ПРЕМІУМ ПОТІК (WEB STREAM): Повертаємо Event-Stream заголовки для преміального UX
    return new Response(sseStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no", // Вимикає проміжне проксі-кешування на серверах Vercel/Nginx
      },
    });

  } catch (error: any) {
    console.error("🚨 Помилка Потокового Шлюзу ШІ:", error);
    return NextResponse.json({ error: "Внутрішня помилка сервера при генерації потоку" }, { status: 500 });
  }
}
