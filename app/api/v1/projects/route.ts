import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Prisma, Project, WebhookConfig } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Регулярний вираз для валідації ідентифікаторів MongoDB ObjectId
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

// 1. МЕТОД GET: Читання реальних проєктів поточного користувача
export async function GET(): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const currentUserId = session.user.id.trim();

    if (!OBJECT_ID_REGEX.test(currentUserId)) {
      return NextResponse.json(
        { success: false, error: "Некоректний формат ідентифікатора сесії" },
        { status: 400 },
      );
    }

    const findArgs: Prisma.ProjectFindManyArgs = {
      where: { userId: currentUserId },
      orderBy: { createdAt: "desc" },
      take: 15, // Розширено ліміт вибірки для зручності у воркспейсі
    };

    const rawProjects: Project[] = await prisma.project.findMany(findArgs);

    const projects = rawProjects.map((proj: Project) => ({
      id: proj.id,
      title: proj.title,
      description: proj.description || "Опис відсутній у базі",
      budget: proj.budget,
      status: proj.status,
      userId: currentUserId,
    }));

    return NextResponse.json({ success: true, projects }, { status: 200 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("  [ API_PROJECTS_GET_CRASH ]:", err.message);
    return NextResponse.json(
      {
        success: false,
        error: "Помилка сервера при отриманні списку проєктів",
      },
      { status: 500 },
    );
  }
}

// 2. МЕТОД POST: Безвідмовне створення проєкту з лімітами та тригерами вебхуків
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const currentUserId = session.user.id.trim();

    if (!OBJECT_ID_REGEX.test(currentUserId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Некоректний формат сесії для запису ресурсу",
        },
        { status: 400 },
      );
    }

    const bodyData = (await req.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const { title, description, budget, status } = bodyData;

    if (!title || typeof title !== "string" || title.trim().length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: "Назва проєкту має містити мінімум 2 символи",
        },
        { status: 400 },
      );
    }

    const parsedBudget = Number(budget);
    if (isNaN(parsedBudget) || parsedBudget < 0) {
      return NextResponse.json(
        { success: false, error: "Бюджет повинен бути позитивним числом" },
        { status: 400 },
      );
    }

    const allowedStatuses = ["PLANNING", "ACTIVE", "COMPLETED", "SUSPENDED"];
    const finalStatus = allowedStatuses.includes(String(status))
      ? String(status)
      : "PLANNING";

    const userExists = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!userExists) {
      return NextResponse.json(
        {
          success: false,
          error: "Користувача не знайдено в кластері бази даних",
        },
        { status: 400 },
      );
    }

    const currentPlan = userExists.plan || "FREE";
    const currentRole = userExists.role || "DEVELOPER";

    // =================================================================
    //  СУВОРІ СЕРВЕРНІ FREEMIUM / COMMERCIAL БАР'ЄРИ (Для не-адмінів)
    // =================================================================
    if (currentRole !== "ADMIN") {
      const projectCount = await prisma.project.count({
        where: { userId: currentUserId },
      });

      // Гуард для безкоштовного тарифу (FREE)
      if (currentPlan === "FREE") {
        if (projectCount >= 2) {
          return NextResponse.json(
            {
              success: false,
              error:
                "LIMIT_REACHED: На безкоштовному тарифі доступно максимум 2 проєкти. Оновіть план до PRO.",
            },
            { status: 403 },
          );
        }
        if (parsedBudget > 500) {
          return NextResponse.json(
            {
              success: false,
              error:
                "LIMIT_REACHED: Комерційний ліміт бюджету для FREE тарифу становить $500. Оновіть план до PRO.",
            },
            { status: 403 },
          );
        }
      }

      // ФІКС БІЛІНГУ: Гуард для преміального тарифу (PRO)
      if (currentPlan === "PRO") {
        if (projectCount >= 10) {
          return NextResponse.json(
            {
              success: false,
              error:
                "LIMIT_REACHED: На тарифі PRO доступно максимум 10 проєктів. Оновіть план до ENTERPRISE.",
            },
            { status: 403 },
          );
        }
        if (parsedBudget > 10000) {
          return NextResponse.json(
            {
              success: false,
              error:
                "LIMIT_REACHED: Максимальний ліміт бюджету однієї ноди для PRO тарифу становить $10,000.",
            },
            { status: 403 },
          );
        }
      }
    }

    // Створення суворої реляції проєкту
    const newProject: Project = await prisma.project.create({
      data: {
        title: title.trim(),
        description: description
          ? String(description).trim()
          : "Інструкція розробника",
        budget: parsedBudget,
        status: finalStatus,
        user: {
          connect: { id: currentUserId },
        },
      },
    });

    const fullProject = {
      id: newProject.id,
      title: newProject.title,
      description: newProject.description || "Інструкція розробника",
      budget: newProject.budget,
      status: newProject.status,
      userId: currentUserId,
    };

    // Записуємо створення проєкту в головну NoSQL-історію для утилізації токенів
    await prisma.apiHistory.create({
      data: {
        userId: currentUserId,
        method: "POST",
        url: req.nextUrl.pathname,
        status: 201,
        body: JSON.stringify({ title: title.trim(), budget: parsedBudget }),
        response: JSON.stringify({ success: true, project: fullProject }),
      },
    });

    // Читання та безпечне виконання підключених шлюзів автоматизації (Вебхуків)
    const webhookConfigs: WebhookConfig[] = await prisma.webhookConfig.findMany(
      {
        where: { userId: currentUserId, isActive: true },
      },
    );

    if (webhookConfigs.length > 0) {
      // НАДІЙНИЙ ФІКС: використовуємо await для Promise.all, щоб Next.js
      // гарантовано завершив надсилання запитів стороннім сервісам до закриття з'єднання
      await Promise.all(
        webhookConfigs.map(async (wh: WebhookConfig) => {
          const targetUrl = wh.targetUrl;
          if (!targetUrl) return;

          try {
            const response = await fetch(targetUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-NextOps-Event": "PROJECT_CREATED",
              },
              body: JSON.stringify({
                eventId: wh.id,
                eventType: "PROJECT_CREATED",
                timestamp: new Date().toISOString(),
                payload: fullProject,
              }),
            });

            // ФІКС ТИПІЗАЦІЇ: Обов'язково передаємо currentUserId для коректного FinOps-обліку
            await prisma.apiHistory.create({
              data: {
                userId: currentUserId,
                method: "FEEDBACK",
                url: targetUrl,
                response: `[WEBHOOK_SUCCESS] Код: ${response.status}. Проєкт: ${fullProject.title}`,
                headers: `Status: ${response.status}`,
                status: response.status,
              },
            });
          } catch (whError: unknown) {
            const errWh = whError as Error;
            console.error(
              `🚨 Не вдалося надіслати вебхук на ${targetUrl}:`,
              errWh.message,
            );

            await prisma.apiHistory.create({
              data: {
                userId: currentUserId,
                method: "FEEDBACK",
                url: targetUrl,
                response: `[WEBHOOK_CRASH] Збій маршрутизації: ${errWh.message || "Сервер недоступний"}`,
                headers: "Status: 502",
                status: 502,
              },
            });
          }
        }),
      ).catch((err: unknown) => console.error("Помилка пулу вебхуків:", err));
    }

    console.log(
      ` [ MongoDB Atlas ]: Створено ШІ-ноду проєкту: ${fullProject.title}`,
    );

    return NextResponse.json(
      { success: true, project: fullProject },
      { status: 201 },
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("  [ API_PROJECTS_POST_CRASH ]:", err.message);
    return NextResponse.json(
      {
        success: false,
        error: "Внутрішня помилка сервера при створенні проєкту",
      },
      { status: 500 },
    );
  }
}
