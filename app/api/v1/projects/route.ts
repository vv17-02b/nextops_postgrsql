import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 1. МЕТОД GET: Зчитування проектів ТІЛЬКИ поточного авторизованого розробника
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const projects = await prisma.project.findMany({
      where: { userId }, 
      orderBy: { createdAt: "desc" },
      take: 10, 
    });

    return NextResponse.json({ success: true, projects }, { status: 200 });
  } catch (error: any) {
    console.error("⚠️ [ API_PROJECTS_GET_CRASH ]:", error);
    return NextResponse.json({ success: false, error: "Помилка сервера" }, { status: 500 });
  }
}

// 2. МЕТОД POST: Створення нового проекту з нативною валідацією та Event-Тригером вебхуків
export async function POST(req: NextRequest) {
  try {
    // А. Безпека: перевіряємо сесію користувача
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const bodyData = await req.json().catch(() => ({}));
    const { title, description, budget, status } = bodyData;

    // Б. Нативна валідація даних
    if (!title || typeof title !== "string" || title.trim().length < 2) {
      return NextResponse.json({ 
        success: false, 
        error: "Назва проєкту має містити мінімум 2 символи" 
      }, { status: 400 });
    }

    const parsedBudget = Number(budget);
    if (isNaN(parsedBudget) || parsedBudget < 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Бюджет повинен бути позитивним числовим значенням" 
      }, { status: 400 });
    }

    const allowedStatuses = ["PLANNING", "ACTIVE", "COMPLETED", "SUSPENDED"];
    const finalStatus = allowedStatuses.includes(status) ? status : "PLANNING";

    // В. Перевірка наявності користувача в MongoDB Atlas
    const userExists = await prisma.user.findUnique({
      where: { id: currentUserId }
    });

    if (!userExists) {
      return NextResponse.json({ 
        success: false, 
        error: "Користувача не знайдено в базі даних кластера MongoDB Atlas." 
      }, { status: 400 });
    }

    // Г. Запис нового NoSQL документа в базу даних
    const newProject = await prisma.project.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        budget: parsedBudget, 
        status: finalStatus,
        userId: currentUserId,
      },
    });

    // =================================================================
    // 🔥 АВТОМАТИЗАЦІЯ (Крок №4): НАЙПОТУЖНІШИЙ EVENT TRIGGER ВЕБХУКІВ
    // =================================================================
    // Шукаємо активні конфігурації вебхуків користувача для події "PROJECT_COMPLETED" або глобального тригера
    const webhookConfigs = await prisma.webhookConfig.findMany({
      where: {
        userId: currentUserId,
        isActive: true
      }
    });

    // Якщо користувач налаштував інтеграції у Вікні №2, запускаємо паралельну розсилку через Promise.all
    if (webhookConfigs.length > 0) {
      // Виконуємо запити у фоновому режимі (без блокування основної відповіді клієнту)
      Promise.all(
        webhookConfigs.map(async (wh) => {
          try {
            const response = await fetch(wh.targetUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-NextOps-Event": "PROJECT_CREATED",
              },
              body: JSON.stringify({
                eventId: wh.id,
                eventType: "PROJECT_CREATED",
                timestamp: new Date().toISOString(),
                payload: {
                  projectId: newProject.id,
                  title: newProject.title,
                  budget: newProject.budget,
                  status: newProject.status
                }
              }),
            });

            // Записуємо результат доставки у вашу системну стрічку логів (Вікно №3)
            await prisma.apiHistory.create({
              data: {
                userId: currentUserId,
                method: "POST_WEBHOOK",
                url: wh.targetUrl,
                headers: `Status: ${response.status}`,
                body: JSON.stringify({ projectId: newProject.id }),
                response: `Вебхук успішно доставлено на шлюз. Код: ${response.status}`,
                status: response.status
              }
            });

          } catch (whError: any) {
            console.error(`🚨 Не вдалося надіслати вебхук на ${wh.targetUrl}:`, whError.message);
            // Фіксуємо помилку доставки у логах MongoDB, щоб інженер бачив збій у Вікні №3
            await prisma.apiHistory.create({
              data: {
                userId: currentUserId,
                method: "POST_WEBHOOK_ERROR",
                url: wh.targetUrl,
                headers: "Status: CRASH",
                body: JSON.stringify({ projectId: newProject.id }),
                response: `Збій маршрутизації: ${whError.message || "Цільовий сервер недоступний"}`,
                status: 502
              }
            });
          }
        })
      ).catch(err => console.error("Помилка пулу тригерів:", err));
    }

    // Повертаємо успішну відповідь фронтенду
    return NextResponse.json({ success: true, project: newProject }, { status: 201 });

  } catch (error: any) {
    console.error("⚠️ [ API_PROJECTS_POST_CRASH ]:", error);
    return NextResponse.json({ success: false, error: "Помилка сервера при створенні проекту" }, { status: 500 });
  }
}
