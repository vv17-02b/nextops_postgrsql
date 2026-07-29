// C:\Users\Admin\Documents\my-unified-work-space\app\api\v1\user\profile\route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Твій синглтон бази даних
import { auth } from "@/lib/auth"; // Твоя нативна система сесій Auth.js v5

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  try {
    // 1. БЕЗПЕКА: Доступ дозволено виключно автентифікованим користувачам
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const bodyData = await req.json().catch(() => ({}));
    const { name, image } = bodyData;

    // 2. ВАЛІДАЦІЯ: Перевіряємо формат імені розробника
    if (name !== undefined && (typeof name !== "string" || name.trim().length < 2)) {
      return NextResponse.json({ 
        success: false, 
        error: "Системний нікнейм має містити мінімум 2 символи" 
      }, { status: 400 });
    }

    // Готуємо об'єкт для мутації NoSQL документа
    const updateData: Record<string, any> = {};
    
    if (name !== undefined) updateData.name = name.trim();
    
    // Якщо image передано як пустий рядок або null — це тригер примусового видалення аватара
    if (image !== undefined) {
      updateData.image = image && image.trim() !== "" ? image.trim() : null;
    }

    // 3. МУТАЦІЯ: Оновлюємо документ користувача в MongoDB Atlas через Prisma
    const updatedUser = await prisma.user.update({
      where: { id: currentUserId },
      data: updateData,
      select: {
        id: true,
        name: true,
        image: true,
        plan: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Профіль розробника успішно синхронізовано з MongoDB Atlas",
      user: updatedUser 
    }, { status: 200 });

  } catch (error: any) {
    console.error("⚠️ [ API_USER_PROFILE_MUTATION_CRASH ]:", error.message);
    return NextResponse.json({ 
      success: false, 
      error: "Помилка сервера при оновленні профілю користувача" 
    }, { status: 500 });
  }
}
