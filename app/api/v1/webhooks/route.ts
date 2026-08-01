import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface MockWebhookItem {
  id: string;
  url: string;
  active: boolean;
  createdAt: Date;
  userId?: string;
  targetEvent?: string;
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

    // Приводимо модель до розширеного типу для сумісності з фільтрами
    const webhookModel = prisma.webhookConfig as unknown as {
      findMany: (args?: {
        where?: { userId?: string };
        orderBy?: { createdAt: string };
      }) => Promise<MockWebhookItem[]>;
    };

    const rawWebhooks = await webhookModel.findMany({
      where: { userId: currentUserId },
    });

    // Мапимо під формат фронтенду платформи NextOps Engine v1.2
    const webhooks = rawWebhooks.map((wh: MockWebhookItem) => ({
      id: wh.id,
      userId: currentUserId,
      targetEvent: wh.targetEvent || "PROJECT_CREATED",
      targetUrl: wh.url,
      isActive: wh.active,
      createdAt: wh.createdAt,
    }));

    return NextResponse.json({ success: true, webhooks }, { status: 200 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error(" [ API_WEBHOOKS_GET_CRASH ]:", err.message);
    return NextResponse.json(
      { success: false, error: "Помилка сервера при читанні правил" },
      { status: 500 },
    );
  }
}
// 2. МЕТОД POST: Створення нового правила автоматизації вебхуків
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
    const bodyData = await req.json().catch(() => ({}));
    const { targetEvent, targetUrl } = bodyData;

    if (!targetEvent || !targetUrl || !String(targetUrl).trim()) {
      return NextResponse.json(
        { success: false, error: "Подія та цільовий URL є обов'язаковими" },
        { status: 400 },
      );
    }

    // Приводимо модель до розширеного типу для сумісності з кастомним методом create
    const webhookModel = prisma.webhookConfig as unknown as {
      create: (args: {
        data: { url: string; active: boolean };
      }) => Promise<MockWebhookItem>;
    };

    // Синхронізуємо назви полів під наше NoSQL-ядро (url замість targetUrl, active замість isActive)
    const rawWebhook = await webhookModel.create({
      data: {
        url: String(targetUrl).trim(),
        active: true,
      },
    });

    const newWebhook = {
      id: rawWebhook.id,
      userId: currentUserId,
      targetEvent: String(targetEvent).trim(),
      targetUrl: rawWebhook.url,
      isActive: rawWebhook.active,
      createdAt: rawWebhook.createdAt,
    };

    return NextResponse.json(
      { success: true, webhook: newWebhook },
      { status: 201 },
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error(" [ API_WEBHOOKS_POST_CRASH ]:", err.message);
    return NextResponse.json(
      { success: false, error: "Помилка сервера при створенні тригера" },
      { status: 500 },
    );
  }
}

// 3. МЕТОД PUT: Динамічне увімкнення/вимкнення (Toggle) активності вебхука з Вікна №2
export async function PUT(req: NextRequest): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const currentUserId = session.user.id;
    const bodyData = await req.json().catch(() => ({}));
    const { id, isActive } = bodyData;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Ідентифікатор вебхука (id) обов'язковий" },
        { status: 400 },
      );
    }

    // Емулюємо findUnique через findMany, оскільки у нашому Mock-класі немає методу findUnique
    const webhookModel = prisma.webhookConfig as unknown as {
      findMany: () => Promise<MockWebhookItem[]>;
      update: (args: {
        where: { id: string };
        data: { active: boolean };
      }) => Promise<MockWebhookItem>;
    };

    const allWebhooks = await webhookModel.findMany();
    const existingWebhook = allWebhooks.find((wh) => wh.id === id);

    if (!existingWebhook) {
      return NextResponse.json(
        { success: false, error: "Конфігурацію вебхука не знайдено" },
        { status: 404 },
      );
    }

    // Оновлюємо прапорець активності в NoSQL заглушці
    const rawUpdatedWebhook = await webhookModel.update({
      where: { id },
      data: {
        active: Boolean(isActive),
      },
    });

    const updatedWebhook = {
      id: rawUpdatedWebhook.id,
      userId: currentUserId,
      targetEvent: "PROJECT_CREATED",
      targetUrl: rawUpdatedWebhook.url,
      isActive: rawUpdatedWebhook.active,
      createdAt: rawUpdatedWebhook.createdAt,
    };

    return NextResponse.json(
      { success: true, webhook: updatedWebhook },
      { status: 200 },
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error(" [ API_WEBHOOKS_PUT_CRASH ]:", err.message);
    return NextResponse.json(
      {
        success: false,
        error: "Помилка сервера при оновленні статусу вебхука",
      },
      { status: 500 },
    );
  }
}
