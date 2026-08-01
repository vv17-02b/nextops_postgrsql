import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Строгі інтерфейси сутностей для повної відмови від any
interface MockProjectItem {
  id: string;
  name: string;
  budget: number;
  status: string;
  userId?: string;
  description?: string | null;
}

interface MockWebhookConfigItem {
  id: string;
  url: string;
  active: boolean;
  createdAt: Date;
  targetUrl?: string;
}

interface MockUserWithPlan {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: "FREE" | "PRO" | "ENTERPRISE";
}

// 1. МЕТОД GET: Зчитування проектів ТІЛЬКИ поточного авторизованого розробника
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

    const projectModel = prisma.project as unknown as {
      findMany: (args?: {
        where?: { userId?: string };
        orderBy?: { createdAt: string };
        take?: number;
      }) => Promise<MockProjectItem[]>;
    };

    const rawProjects = await projectModel.findMany({
      where: { userId: currentUserId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const projects = rawProjects.map((proj: MockProjectItem) => ({
      id: proj.id,
      title: proj.name,
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
      { success: false, error: "Помилка сервера при отриманні списку нод" },
      { status: 500 },
    );
  }
}

// 2. МЕТОД POST: Створення нового проекту з нативною валідацією та Freemium-лімітами
export async function POST(req: NextRequest): Promise<Response> {
  try {
    // А. Безпека: перевіряємо сесію користувача
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

    // Б. Нативна валідація даних
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
        {
          success: false,
          error: "Бюджет повинен бути позитивним числовим значенням",
        },
        { status: 400 },
      );
    }

    const allowedStatuses = ["PLANNING", "ACTIVE", "COMPLETED", "SUSPENDED"];
    const finalStatus = allowedStatuses.includes(status) ? status : "PLANNING";

    // В. Перевірка наявності користувача в MongoDB Atlas за Email
    const userModel = prisma.user as unknown as {
      findUnique: (args: { where: { email: string } }) => Promise<MockUserWithPlan | null>;
    };

    const userExists = await userModel.findUnique({
      where: { email: session.user.email },
    });

    if (!userExists) {
      return NextResponse.json(
        {
          success: false,
          error: "Користувача не знайдено в базі даних кластера",
        },
        { status: 400 },
      );
    }

    // Г. БІЗНЕС-ПЛАН: Захист Freemium лімітів для тарифу FREE (БЕЗ ЖОДНОГО ANY)
    const currentPlan = userExists.plan || "FREE";

    if (currentPlan === "FREE") {
      const projectModelForCount = prisma.project as unknown as {
        count: (args?: { where?: { userId?: string } }) => Promise<number>;
      };

      const projectCount = await projectModelForCount.count({
        where: { userId: currentUserId },
      });

      if (projectCount >= 2) {
        return NextResponse.json(
          {
            success: false,
            error:
              "LIMIT_REACHED: На безкоштовному тарифі FREE доступно максимум 2 проєкти. Зробіть Upgrade Plan для зняття лімітів ШІ-агентів.",
          },
          { status: 403 },
        );
      }
    }

    // Д. Запис нового NoSQL документа в базу даних
    const projectModelForCreate = prisma.project as unknown as {
      create: (args: {
        data: { name: string; budget: number; status: string };
      }) => Promise<{ id: string; name: string; budget: number; status: string }>;
    };

    const newProject = await projectModelForCreate.create({
      data: {
        name: title.trim(),
        budget: parsedBudget,
        status: finalStatus,
      },
    });

    // Насичуємо об'єкт додатковими полями для внутрішньої сумісності фронтенду
    const fullProject = {
      id: newProject.id,
      title: newProject.name,
      description: description ? description.trim() : "Інструкція розробника",
      budget: newProject.budget,
      status: newProject.status,
      userId: currentUserId,
    };

    // Строге визначення моделі WebhookConfig для запобігання TS2554
    const webhookModel = prisma.webhookConfig as unknown as {
      findMany: (args?: {
        where?: { active?: boolean; userId?: string };
      }) => Promise<MockWebhookConfigItem[]>;
    };

    const apiHistoryModel = prisma.apiHistory as unknown as {
      create: (args: {
        data: {
          method: string;
          url: string;
          response: string;
          headers: string;
          status: number;
        };
      }) => Promise<unknown>;
    };

    // Шукаємо активні конфігурації вебхуків
    const webhookConfigs = await webhookModel.findMany({
      where: { active: true },
    });

    // Е. Запускаємо паралельну розсилку через Promise.all
    if (webhookConfigs.length > 0) {
      Promise.all(
        webhookConfigs.map(async (wh: MockWebhookConfigItem) => {
          try {
            const targetUrl = wh.targetUrl || wh.url || "";
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

            await apiHistoryModel.create({
              data: {
                method: "FEEDBACK",
                url: targetUrl,
                response: `[WEBHOOK_SUCCESS] Код: ${response.status}. Проєкт: ${fullProject.title}`,
                headers: `Status: ${response.status}`,
                status: response.status,
              },
            });
          } catch (whError: unknown) {
            const errWh = whError as Error;
            const fallbackUrl = wh.targetUrl || wh.url || "unknown_gateway";
            console.error(
              `🚨 Не вдалося надіслати вебхук на ${fallbackUrl}:`,
              errWh.message,
            );

            await apiHistoryModel.create({
              data: {
                method: "FEEDBACK",
                url: fallbackUrl,
                response: `[WEBHOOK_CRASH] Збій маршрутизації: ${errWh.message || "Цільовий сервер недоступний"}`,
                headers: "Status: 502",
                status: 502,
              },
            });
          }
        }),
      ).catch((err: unknown) =>
        console.error("Помилка пулу тригерів вебхуків:", err),
      );
    }

    // Повертаємо успішну відповідь фронтенду
    return NextResponse.json(
      { success: true, project: fullProject },
      { status: 201 },
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error(" [ API_PROJECTS_POST_CRASH ]:", err.message);
    return NextResponse.json(
      { success: false, error: "Помилка сервера при створенні проекту" },
      { status: 500 },
    );
  }
}