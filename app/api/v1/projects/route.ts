import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Prisma, Project, WebhookConfig } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    const currentUserId = session.user.id;

    // Сувора типізація вибірки з MongoDB Atlas
    const findArgs: Prisma.ProjectFindManyArgs = {
      where: { userId: currentUserId },
      orderBy: { createdAt: "desc" },
      take: 10,
    };

    const rawProjects: Project[] = await prisma.project.findMany(findArgs);

    // Мапимо дані під очікування фронтенду воркспейсу
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
    console.error(" [ API_PROJECTS_GET_CRASH ]:", err.message);
    return NextResponse.json(
      { success: false, error: "Помилка сервера при отриманні списку проєктів" },
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

    const currentUserId = session.user.id;
    const bodyData = await req.json().catch(() => ({}));
    const { title, description, budget, status } = bodyData;

    if (!title || typeof title !== "string" || title.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Назва проєкту має містити мінімум 2 символи" },
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
    const finalStatus = allowedStatuses.includes(status) ? status : "PLANNING";

    // Шукаємо користувача для перевірки комерційних Freemium лімітів
    const userExists = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!userExists) {
      return NextResponse.json(
        { success: false, error: "Користувача не знайдено в кластері бази даних" },
        { status: 400 },
      );
    }

    const currentPlan = userExists.plan || "FREE";
    const currentRole = userExists.role || "DEVELOPER";

    // СУВОРІ СЕРВЕРНІ FREEMIUM-БАР'ЄРИ (Для не-адмінів)
    if (currentPlan === "FREE" && currentRole !== "ADMIN") {
      const projectCountArgs: Prisma.ProjectCountArgs = {
        where: { userId: currentUserId },
      };
      const projectCount = await prisma.project.count(projectCountArgs);

      if (projectCount >= 2) {
        return NextResponse.json(
          {
            success: false,
            error: "LIMIT_REACHED: На безкоштовному тарифі доступно максимум 2 проєкти. Оновіть план до PRO.",
          },
          { status: 403 },
        );
      }

      if (parsedBudget > 500) {
        return NextResponse.json(
          {
            success: false,
            error: "LIMIT_REACHED: Комерційний ліміт бюджету для FREE тарифу становить $500. Оновіть план до PRO.",
          },
          { status: 403 },
        );
      }
    }

    // ПРОДАКШЕН ФІКС: Передаємо строго "title", а не "name", та пов'язуємо реляцію ObjectId
    const createProjectArgs: Prisma.ProjectCreateArgs = {
      data: {
        title: title.trim(),
        description: description ? description.trim() : "Інструкція розробника",
        budget: parsedBudget,
        status: finalStatus,
        user: {
          connect: { id: currentUserId }
        }
      }
    };

    const newProject: Project = await prisma.project.create(createProjectArgs);

    const fullProject = {
      id: newProject.id,
      title: newProject.title,
      description: newProject.description || "Інструкція розробника",
      budget: newProject.budget,
      status: newProject.status,
      userId: currentUserId,
    };

    // Зчитуємо активні конфіги вебхуків згідно правильних назв полей у схемі
    const webhookQueryArgs: Prisma.WebhookConfigFindManyArgs = {
      where: { userId: currentUserId, isActive: true }
    };
    const webhookConfigs: WebhookConfig[] = await prisma.webhookConfig.findMany(webhookQueryArgs);

    if (webhookConfigs.length > 0) {
      Promise.all(
        webhookConfigs.map(async (wh: WebhookConfig) => {
          try {
            const targetUrl = wh.targetUrl;
            if (!targetUrl) return;

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

            await prisma.apiHistory.create({
              data: {
                method: "FEEDBACK",
                url: targetUrl,
                response: `[WEBHOOK_SUCCESS] Код: ${response.status}. Проєкт: ${fullProject.title}`,
                headers: `Status: ${response.status}`,
                status: response.status,
              }
            });
          } catch (whError: unknown) {
            const errWh = whError as Error;
            const fallbackUrl = wh.targetUrl || "unknown_gateway";
            console.error(`🚨 Не вдалося надіслати вебхук на ${fallbackUrl}:`, errWh.message);

            await prisma.apiHistory.create({
              data: {
                method: "FEEDBACK",
                url: fallbackUrl,
                response: `[WEBHOOK_CRASH] Збій маршрутизації: ${errWh.message || "Сервер недоступний"}`,
                headers: "Status: 502",
                status: 502,
              }
            });
          }
        }),
      ).catch((err: unknown) => console.error("Помилка пулу вебхуків:", err));
    }

    return NextResponse.json(
      { success: true, project: fullProject },
      { status: 201 },
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error(" [ API_PROJECTS_POST_CRASH ]:", err.message);
    return NextResponse.json(
      { success: false, error: "Внутрішня помилка сервера при створенні проєкту" },
      { status: 500 },
    );
  }
}
