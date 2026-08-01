import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface MockWebhookConfigInput {
  id: string;
  targetEvent: string;
  targetUrl: string;
  isActive: boolean;
  userId: string;
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
    const webhookModel = prisma.webhookConfig as unknown as {
      findMany: (args?: {
        where?: { userId?: string };
        orderBy?: { createdAt: string };
      }) => Promise<MockWebhookConfigInput[]>;
    };

    const webhooks = await webhookModel.findMany({
      where: { userId: currentUserId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, webhooks }, { status: 200 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error(" [ API_WEBHOOKS_GET_CRASH ]:", err.message);
    return NextResponse.json(
      { success: false, error: "Помилка сервера" },
      { status: 500 },
    );
  }
}
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const currentUserId = session.user.id;
    const userPlan = session.user.plan || "FREE";
    const userRole = session.user.role || "DEVELOPER";

    // Суворий бар'єр: користувачі без ліцензії PRO не можуть створювати нові інструменти автоматизації
    if (userPlan === "FREE" && userRole !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error:
            "ACCESS_DENIED: Створення Вебхук-тригерів заблоковано на тарифі FREE. Будь ласка, оновіть ліцензію до PRO.",
        },
        { status: 403 },
      );
    }

    const bodyData = await req.json().catch(() => ({}));
    const { targetEvent, targetUrl, isActive } = bodyData;

    if (
      !targetUrl ||
      typeof targetUrl !== "string" ||
      !targetUrl.startsWith("http")
    ) {
      return NextResponse.json(
        { success: false, error: "Некоректна URL-адреса призначення вебхука" },
        { status: 400 },
      );
    }

    const allowedEvents = [
      "PROJECT_CREATED",
      "PROJECT_COMPLETED",
      "AI_TRIGGER",
      "BUDGET_WARN",
    ];
    const finalEvent = allowedEvents.includes(targetEvent)
      ? targetEvent
      : "PROJECT_COMPLETED";

    const webhookModel = prisma.webhookConfig as unknown as {
      create: (args: {
        data: {
          targetEvent: string;
          targetUrl: string;
          isActive: boolean;
          userId: string;
        };
      }) => Promise<MockWebhookConfigInput>;
    };

    const newWebhook = await webhookModel.create({
      data: {
        targetEvent: finalEvent,
        targetUrl: targetUrl.trim(),
        isActive: typeof isActive === "boolean" ? isActive : true,
        userId: currentUserId,
      },
    });

    return NextResponse.json(
      { success: true, webhook: newWebhook },
      { status: 201 },
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error(" [ API_WEBHOOKS_POST_CRASH ]:", err.message);
    return NextResponse.json(
      { success: false, error: "Помилка сервера при збереженні шлюзу" },
      { status: 500 },
    );
  }
}
