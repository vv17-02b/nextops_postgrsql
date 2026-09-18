import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Prisma, WebhookConfig } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Регулярний вираз для перевірки валідності MongoDB ObjectId (24 шістнадцяткові символи)
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

// 1. МЕТОД GET: Читання налаштованих вебхуків розробника з MongoDB Atlas
export async function GET(): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;

    const queryArgs: Prisma.WebhookConfigFindManyArgs = {
      where: { userId: currentUserId },
      orderBy: { createdAt: "desc" }
    };

    const rawWebhooks: WebhookConfig[] = await prisma.webhookConfig.findMany(queryArgs);

    const webhooks = rawWebhooks.map((wh: WebhookConfig) => ({
      id: wh.id,
      userId: currentUserId,
      targetEvent: wh.targetEvent,
      targetUrl: wh.targetUrl,
      isActive: wh.isActive,
      createdAt: wh.createdAt,
    }));

    return NextResponse.json({ success: true, webhooks }, { status: 200 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error(" [ API_WEBHOOKS_GET_CRASH ]:", err.message);
    return NextResponse.json(
      { success: false, error: "Помилка сервера при читанні правил автоматизації" },
      { status: 500 },
    );
  }
}

// 2. МЕТОД POST: Створення нового правила автоматизації
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const bodyData = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const { targetEvent, targetUrl } = bodyData;

    if (!targetEvent || !targetUrl || !String(targetUrl).trim()) {
      return NextResponse.json(
        { success: false, error: "Подія та цільовий URL є обов'язковими полями" },
        { status: 400 },
      );
    }

    const createArgs: Prisma.WebhookConfigCreateArgs = {
      data: {
        targetUrl: String(targetUrl).trim(),
        isActive: true,
        targetEvent: String(targetEvent).trim(),
        user: {
          connect: { id: currentUserId }
        }
      }
    };

    const rawWebhook: WebhookConfig = await prisma.webhookConfig.create(createArgs);

    const newWebhook = {
      id: rawWebhook.id,
      userId: currentUserId,
      targetEvent: rawWebhook.targetEvent,
      targetUrl: rawWebhook.targetUrl,
      isActive: rawWebhook.isActive,
      createdAt: rawWebhook.createdAt,
    };

    // Запис успішної операції створення в NoSQL-історію для FinOps інспектора
    await prisma.apiHistory.create({
      data: {
        userId: currentUserId,
        method: "POST",
        url: req.nextUrl.pathname,
        status: 201,
        body: JSON.stringify({ targetEvent, targetUrl }),
        response: JSON.stringify({ success: true, webhook: newWebhook })
      }
    });

    console.log(` [ MongoDB Atlas ]: Створено новий вебхук тригер для події: ${targetEvent}`);

    return NextResponse.json({ success: true, webhook: newWebhook }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error(" [ API_WEBHOOKS_POST_CRASH ]:", err.message);
    return NextResponse.json(
      { success: false, error: "Помилка сервера при створенні тригера автоматизації" },
      { status: 500 },
    );
  }
}

// 3. МЕТОД PUT: Динамічне перемикання статусу активності вебхука (БЕЗПЕЧНИЙ ФІКС)
export async function PUT(req: NextRequest): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const bodyData = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const { id, isActive } = bodyData;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ success: false, error: "Ідентифікатор вебхука (id) є обов'язковим" }, { status: 400 });
    }

    const cleanId = id.trim();

    // 1. Гуард валідації ObjectId від падіння BSON-драйвера MongoDB Atlas
    if (!OBJECT_ID_REGEX.test(cleanId)) {
      return NextResponse.json({ success: false, error: "Некоректний формат ідентифікатора вебхука" }, { status: 400 });
    }

    const existingWebhook: WebhookConfig | null = await prisma.webhookConfig.findUnique({
      where: { id: cleanId }
    });

    if (!existingWebhook) {
      return NextResponse.json({ success: false, error: "Конфігурацію вебхука не знайдено" }, { status: 404 });
    }

    // 2. Гуард безпеки: Перевіряємо приналежність вебхука користувачу
    if (String(existingWebhook.userId) !== String(currentUserId)) {
      return NextResponse.json({ success: false, error: "Немає прав для редагування цього ресурсу" }, { status: 403 });
    }

    // 3. Суворе виконання мутації
    const rawUpdatedWebhook: WebhookConfig = await prisma.webhookConfig.update({
      where: { id: cleanId },
      data: { isActive: Boolean(isActive) }
    });

    const updatedWebhook = {
      id: rawUpdatedWebhook.id,
      userId: currentUserId,
      targetEvent: rawUpdatedWebhook.targetEvent,
      targetUrl: rawUpdatedWebhook.targetUrl,
      isActive: rawUpdatedWebhook.isActive,
      createdAt: rawUpdatedWebhook.createdAt,
    };

    // 4. Логування операції оновлення для FinOps білінгу спалених токенів ШІ
    await prisma.apiHistory.create({
      data: {
        userId: currentUserId,
        method: "PUT",
        url: req.nextUrl.pathname,
        status: 200,
        body: JSON.stringify({ id: cleanId, isActive }),
        response: JSON.stringify({ success: true, webhook: updatedWebhook })
      }
    });

    return NextResponse.json({ success: true, webhook: updatedWebhook }, { status: 200 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error(" [ API_WEBHOOKS_PUT_CRASH ]:", err.message);
    return NextResponse.json({ success: false, error: "Помилка сервера при оновленні статусу" }, { status: 500 });
  }
}

// 4. МЕТОД DELETE: Повне безпечне видалення правил автоматизації
export async function DELETE(req: NextRequest): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Ідентифікатор (id) обов'язковий" }, { status: 400 });
    }

    const cleanId = id.trim();

    if (!OBJECT_ID_REGEX.test(cleanId)) {
      return NextResponse.json({ success: false, error: "Некоректний формат ідентифікатора для видалення" }, { status: 400 });
    }

    const existingWebhook = await prisma.webhookConfig.findUnique({
      where: { id: cleanId }
    });

    if (!existingWebhook) {
      return NextResponse.json({ success: false, error: "Конфігурацію вебхука не знайдено" }, { status: 404 });
    }

    if (String(existingWebhook.userId) !== String(currentUserId)) {
      return NextResponse.json({ success: false, error: "Немає прав для видалення цього ресурсу" }, { status: 403 });
    }

    await prisma.webhookConfig.delete({
      where: { id: cleanId }
    });

    // Запис у лог історії про повне видалення правила автоматизації
    await prisma.apiHistory.create({
      data: {
        userId: currentUserId,
        method: "DELETE",
        url: `${req.nextUrl.pathname}?id=${cleanId}`,
        status: 200,
        body: null,
        response: JSON.stringify({ success: true, message: "Ресурс деінстальовано" })
      }
    });

    console.log(` [ MongoDB Atlas ]: Конфігурацію вебхука ${cleanId} успішно деінстальовано.`);
    return NextResponse.json({ success: true, message: "Правило автоматизації успішно видалено з системи" }, { status: 200 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error(" [ API_WEBHOOKS_DELETE_CRASH ]:", err.message);
    return NextResponse.json({ success: false, error: "Помилка сервера при видаленні вебхука" }, { status: 500 });
  }
}
