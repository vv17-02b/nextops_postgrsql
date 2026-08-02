import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Наш очищений реальний NoSQL хаб
import { auth } from "@/lib/auth"; // Нативна система сесій Auth.js v5

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ProfileUpdatePayload {
  name: string;
}

// МЕТОД PUT: Динамічне оновлення профілю розробника в MongoDB Atlas
export async function PUT(req: NextRequest): Promise<Response> {
  try {
    // 1. БЕЗПЕКА: Доступ дозволено виключно автентифікованим користувачам
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const bodyData = await req.json().catch(() => ({}));
    const { name, image } = bodyData;

    // 2. ВАЛІДАЦІЯ: Перевіряємо формат імені
    if (
      name !== undefined &&
      (typeof name !== "string" || name.trim().length < 2)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Системний нікнейм має містити мінімум 2 символи",
        },
        { status: 400 },
      );
    }

    // Чистий, строго типізований об'єкт мутації NoSQL-документа
    const updateData: Partial<ProfileUpdatePayload> & {
      image?: string | null;
    } = {};

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    // Якщо image передано (будь-який URL аватарки з інтернету чи CDN) — записуємо його динамічно
    if (image !== undefined) {
      updateData.image = image && image.trim() !== "" ? image.trim() : null;
    }

    // 3. МУТАЦІЯ: Оновлюємо документ користувача безпосередньо в MongoDB Atlas за його Email
    // RealPrismaHub виконає цей запис у реальну базу даних повністю автоматично
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: updateData,
    });

    // Мапимо результат для повної фронтенд-сумісності з WorkspaceContext додатка
    const finalFormattedUser = {
      id: updatedUser.id,
      name: updatedUser.name,
      image: updatedUser.image || "/images/incognita.jpg",
      plan: updatedUser.plan || "FREE",
    };

    console.log(` [ MongoDB Atlas ]: Профіль користувача ${session.user.email} успішно оновлено.`);

    return NextResponse.json(
      {
        success: true,
        message: "Профіль розробника успішно синхронізовано з MongoDB Atlas",
        user: finalFormattedUser,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error(" [ API_USER_PROFILE_MUTATION_CRASH ]:", err.message);
    return NextResponse.json(
      {
        success: false,
        error: "Помилка сервера при оновленні профілю користувача",
      },
      { status: 500 },
    );
  }
}
