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

// 1. МЕТОД GET: Читання налаштованих вебхуків розробника
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
      }) => Promise<MockWebhookItem[]>;
    };

    const rawWebhooks = await webhookModel.findMany({
      where: { userId: currentUserId },
    });

    const webhooks = rawWebhooks.map((wh: MockWebhookItem) => ({
      id: wh.id,
      userId: currentUserId,
      targetEvent: wh.targetEvent || "PROJECT_CREATED", // Надійний фолбек
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

// 2. МЕТОД POST: Створення нового правила автоматизації вебхуків з повним збереженням полей
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

    const webhookModel = prisma.webhookConfig as unknown as {
      create: (args: {
        data: { url: string; active: boolean; targetEvent: string; userId: string };
      }) => Promise<MockWebhookItem>;
    };

    // ФІКС: Записуємо targetEvent та userId безпосередньо в базу даних MongoDB Atlas
    const rawWebhook = await webhookModel.create({
      data: {
        url: String(targetUrl).trim(),
        active: true,
        targetEvent: String(targetEvent).trim(),
        userId: currentUserId,
      },
    });

    const newWebhook = {
      id: rawWebhook.id,
      userId: currentUserId,
      targetEvent: rawWebhook.targetEvent || String(targetEvent).trim(),
      targetUrl: rawWebhook.url,
      isActive: rawWebhook.active,
      createdAt: rawWebhook.createdAt,
    };

    console.log(` [ MongoDB Atlas ]: Створено новий вебхук тригер для події: ${targetEvent}`);

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

// 3. МЕТОД PUT: Динамічне увімкнення/вимкнення статусу без втрати типу події
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

    const rawUpdatedWebhook = await webhookModel.update({
      where: { id },
      data: {
        active: Boolean(isActive),
      },
    });

    const updatedWebhook = {
      id: rawUpdatedWebhook.id,
      userId: currentUserId,
      targetEvent: rawUpdatedWebhook.targetEvent || existingWebhook.targetEvent || "PROJECT_CREATED", // Зберігаємо оригінальну подію тригера
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
      { success: false, error: "Помилка сервера при оновленні статусу вебхука" },
      { status: 500 },
    );
  }
}

// 4. МЕТОД DELETE: Повне безпечне видалення правил автоматизації
export async function DELETE(req: NextRequest): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Ідентифікатор (id) обов'язковий для видалення" },
        { status: 400 },
      );
    }

    const webhookModel = prisma.webhookConfig as unknown as {
      delete: (args: { where: { id: string } }) => Promise<MockWebhookItem>;
    };

    await webhookModel.delete({
      where: { id },
    });

    console.log(` [ MongoDB Atlas ]: Конфігурацію вебхука ${id} успішно анігільовано.`);

    return NextResponse.json(
      { success: true, message: "Правило автоматизації успешно видалено" },
      { status: 200 },
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error(" [ API_WEBHOOKS_DELETE_CRASH ]:", err.message);
    return NextResponse.json(
      { success: false, error: "Помилка сервера при видаленні вебхука" },
      { status: 500 },
    );
  }
}
