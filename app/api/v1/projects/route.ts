import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 1. МЕТОД GET: Зчитування проектів ТІЛЬКИ поточного авторизованого розробника
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const projects = await prisma.project.findMany({
      where: { userId }, // Суворий відбір: розробник бачить лише свої NoSQL документи
      orderBy: { createdAt: "desc" },
      take: 10, 
    });

    return NextResponse.json({ success: true, projects }, { status: 200 });
  } catch (error: any) {
    console.error("⚠️ [ API_PROJECTS_GET_CRASH ]:", error);
    return NextResponse.json({ success: false, error: "Помилка сервера при отриманні списку проектів" }, { status: 500 });
  }
}

// 2. МЕТОД POST: Створення нового проекту з динамічною прив'язкою до сесії
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const bodyData = await req.json().catch(() => ({}));
    const { title, description, budget, status } = bodyData;

    // Валідація обов'язкових полів бізнес-логики
    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: "Назва проекту (title) є обов'язаковою" }, { status: 400 });
    }

    // Перевірка наявності користувача в MongoDB Atlas перед записом через сесію
    const userExists = await prisma.user.findUnique({
      where: { id: currentUserId }
    });

    if (!userExists) {
      return NextResponse.json({ 
        success: false, 
        error: "Користувача не знайдено в базі даних кластера MongoDB Atlas." 
      }, { status: 400 });
    }

    // Запис нового NoSQL документа з автоматичною прив'язкою до реального ID сесії
    const newProject = await prisma.project.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        budget: budget ? parseFloat(budget) : 0.0, 
        status: status || "PLANNING",
        userId: currentUserId, // Ніякого хардкоду, беремо з токена Auth.js
      },
    });

    return NextResponse.json({ success: true, project: newProject }, { status: 201 });

  } catch (error: any) {
    console.error("⚠️ [ API_PROJECTS_POST_CRASH ]:", error);
    if (error instanceof Error) {
      console.error(error.stack);
    }
    return NextResponse.json({ success: false, error: error.message || "Помилка сервера при створенні проекту" }, { status: 500 });
  }
}
