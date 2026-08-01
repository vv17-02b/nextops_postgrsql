import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
      { success: false, error: "Помилка сервера" },
      { status: 500 },
    );
  }
}
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
    const finalStatus = allowedStatuses.includes(status) ? status : "PLANNING";

    const userModel = prisma.user as unknown as {
      findUnique: (args: {
        where: { email: string };
      }) => Promise<MockUserWithPlan | null>;
    };

    const userExists = await userModel.findUnique({
      where: { email: session.user.email },
    });

    if (!userExists) {
      return NextResponse.json(
        { success: false, error: "Користувача не знайдено в кластері" },
        { status: 400 },
      );
    }

    const currentPlan = userExists.plan || "FREE";
    const currentRole = userExists.role || "DEVELOPER";

    // СУВОРІ СЕРВЕРНІ FREEMIUM-БАР'ЄРИ (Для не-адмінів)
    if (currentPlan === "FREE" && currentRole !== "ADMIN") {
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
    const projectModelForCreate = prisma.project as unknown as {
      create: (args: {
        data: { name: string; budget: number; status: string };
      }) => Promise<{
        id: string;
        name: string;
        budget: number;
        status: string;
      }>;
    };

    const newProject = await projectModelForCreate.create({
      data: {
        name: title.trim(),
        budget: parsedBudget,
        status: finalStatus,
      },
    });

    const fullProject = {
      id: newProject.id,
      title: newProject.name,
      description: description ? description.trim() : "Інструкція розробника",
      budget: newProject.budget,
      status: newProject.status,
      userId: currentUserId,
    };

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

    const webhookConfigs = await webhookModel.findMany({
      where: { active: true },
    });

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
                response: `[WEBHOOK_CRASH] Збій маршрутизації: ${errWh.message || "Сервер недоступний"}`,
                headers: "Status: 502",
                status: 502,
              },
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
      { success: false, error: "Помилка сервера" },
      { status: 500 },
    );
  }
}
