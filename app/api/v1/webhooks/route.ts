import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Prisma, WebhookConfig } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// 1. МЕТОД GET: Читання налаштованих вебхуків розробника з MongoDB Atlas
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

    // Використовуємо нативну строгу типізацію аргументів Prisma
    const queryArgs: Prisma.WebhookConfigFindManyArgs = {
      where: { userId: currentUserId },
      orderBy: { createdAt: "desc" }
    };

    const rawWebhooks: WebhookConfig[] = await prisma.webhookConfig.findMany(queryArgs);

    // Мапимо поля згідно схеми schema.prisma
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

// 2. МЕТОД POST: Створення нового правила автоматизації з залізобетонним ObjectId зв'язком
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
        { success: false, error: "Подія та цільовий URL є обов'язковими полями" },
        { status: 400 },
      );
    }

    // Створюємо строго за типами схеми: targetUrl, isActive, targetEvent, user
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

    console.log(` [ MongoDB Atlas ]: Створено новий вебхук тригер для події: ${targetEvent}`);

    return NextResponse.json(
      { success: true, webhook: newWebhook },
      { status: 201 },
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error(" [ API_WEBHOOKS_POST_CRASH ]:", err.message);
    return NextResponse.json(
      { success: false, error: "Помилка сервера при створенні тригера автоматизації" },
      { status: 500 },
    );
  }
}

// 3. МЕТОД PUT: Динамічне перемикання статусу активності вебхука
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

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, error: "Ідентифікатор вебхука (id) є обов'язковим" },
        { status: 400 },
      );
    }

    // Безпечний пошук конкретного конфігу за ID
    const findArgs: Prisma.WebhookConfigFindUniqueArgs = {
      where: { id: id.trim() }
    };
    const existingWebhook: WebhookConfig | null = await prisma.webhookConfig.findUnique(findArgs);

    if (!existingWebhook) {
      return NextResponse.json(
        { success: false, error: "Конфігурацію вебхука не знайдено в базі даних" },
        { status: 404 },
      );
    }

    // Оновлюємо поле isActive згідно нашої офіційної схеми
    const updateArgs: Prisma.WebhookConfigUpdateArgs = {
      where: { id: id.trim() },
      data: { isActive: Boolean(isActive) }
    };

    const rawUpdatedWebhook: WebhookConfig = await prisma.webhookConfig.update(updateArgs);

    const updatedWebhook = {
      id: rawUpdatedWebhook.id,
      userId: currentUserId,
      targetEvent: rawUpdatedWebhook.targetEvent,
      targetUrl: rawUpdatedWebhook.targetUrl,
      isActive: rawUpdatedWebhook.isActive,
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

    const deleteArgs: Prisma.WebhookConfigDeleteArgs = {
      where: { id: String(id).trim() }
    };
    
    await prisma.webhookConfig.delete(deleteArgs);

    console.log(` [ MongoDB Atlas ]: Конфігурацію вебхука ${id} успішно деінстальовано.`);

    return NextResponse.json(
      { success: true, message: "Правило автоматизації успішно видалено з системи" },
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
