import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 1. МЕТОД GET: Зчитування вебхуків поточного авторизованого користувача
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const webhooks = await prisma.webhookConfig.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, webhooks }, { status: 200 });
  } catch (error: any) {
    console.error("⚠️ [ API_WEBHOOKS_GET_CRASH ]:", error);
    return NextResponse.json({ success: false, error: "Помилка сервера при читанні правил" }, { status: 500 });
  }
}

// 2. МЕТОД POST: Створення нового правила автоматизації вебхуків
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const bodyData = await req.json().catch(() => ({}));
    const { targetEvent, targetUrl } = bodyData;

    if (!targetEvent || !targetUrl || !targetUrl.trim()) {
      return NextResponse.json({ success: false, error: "Подія та цільовий URL є обов'язаковими" }, { status: 400 });
    }

    const newWebhook = await prisma.webhookConfig.create({
      data: {
        userId,
        targetEvent,
        targetUrl: targetUrl.trim(),
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, webhook: newWebhook }, { status: 201 });
  } catch (error: any) {
    console.error("⚠️ [ API_WEBHOOKS_POST_CRASH ]:", error);
    return NextResponse.json({ success: false, error: "Помилка сервера при створенні тригера" }, { status: 500 });
  }
}

// 3. МЕТОД PUT: Динамічне увімкнення/вимкнення (Toggle) активності вебхука з Вікна №3
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const bodyData = await req.json().catch(() => ({}));
    const { id, isActive } = bodyData;

    if (!id) {
      return NextResponse.json({ success: false, error: "Ідентифікатор вебхука (id) обов'язковий" }, { status: 400 });
    }

    // Перевіряємо, чи належить цей вебхук поточному авторизованому розробнику (Захист даних)
    const existingWebhook = await prisma.webhookConfig.findUnique({
      where: { id }
    });

    if (!existingWebhook) {
      return NextResponse.json({ success: false, error: "Конфігурацію вебхука не знайдено" }, { status: 404 });
    }

    if (existingWebhook.userId !== userId) {
      return NextResponse.json({ success: false, error: "Forbidden: Немає прав доступу до цього об'єкта" }, { status: 403 });
    }

    // Оновлюємо прапорець активності в MongoDB Atlas
    const updatedWebhook = await prisma.webhookConfig.update({
      where: { id },
      data: {
        isActive: Boolean(isActive)
      }
    });

    return NextResponse.json({ success: true, webhook: updatedWebhook }, { status: 200 });
  } catch (error: any) {
    console.error("⚠️ [ API_WEBHOOKS_PUT_CRASH ]:", error);
    return NextResponse.json({ success: false, error: "Помилка сервера при оновленні статусу вебхука" }, { status: 500 });
  }
}
