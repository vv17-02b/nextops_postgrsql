import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 1. МЕТОД GET: Зчитування публічних відгуків користувачів для стрічки
export async function GET() {
  try {
    // Дістаємо останні 10 відгуків з MongoDB Atlas
    const reviews = await prisma.apiHistory.findMany({
      where: {
        method: "FEEDBACK" // Використовуємо окремий маркер у полі method вашої моделі ApiHistory
      },
      orderBy: { 
        createdAt: "desc" 
      },
      take: 10,
    });

    // Форматуємо NoSQL документи під суворі очікування нашого фронтенду
    const formattedReviews = reviews.map((rev) => ({
      id: rev.id,
      user: rev.url || "anonymous", // Мапимо збережене поле під ім'я
      text: rev.response || "No text provided", // Мапимо під текст коментаря
      rating: rev.status || 5, // Мапимо під оцінку зірок
      createdAt: rev.createdAt.toISOString()
    }));

    // Повертаємо об'єкт із суворим ключем reviews, який вимагає лендінг
    return NextResponse.json({ success: true, reviews: formattedReviews }, { status: 200 });
  } catch (error: any) {
    console.error("⚠️ [ API_REVIEWS_GET_CRASH ]:", error);
    return NextResponse.json({ success: false, error: "Помилка сервера при отриманні відгуків" }, { status: 500 });
  }
}

// 2. МЕТОД POST: Збереження нового відгуку безпосередньо в базу даних
export async function POST(req: NextRequest) {
  try {
    const bodyData = await req.json().catch(() => ({}));
    const { user, text, rating } = bodyData;

    if (!user || !text) {
      return NextResponse.json({ success: false, error: "Нікнейм та текст відгуку є обов'язковими" }, { status: 400 });
    }

    // Записуємо дані у вашу універсальну автономну модель ApiHistory
    const newFeedbackLog = await prisma.apiHistory.create({
      data: {
        userId: "65cb7f4a21de456789abcdef", // Тимчасовий дефолтний ObjectId для неавторизованих гостей
        method: "FEEDBACK", // Наш залізний маркер для фільтрації відгуків
        url: user.trim(), // Зберігаємо нікнейм у поле url
        response: text.trim(), // Зберігаємо текст відгуку в поле response
        status: Number(rating) || 5, // Зберігаємо оцінку зірок у полі status
        headers: null,
        body: null
      }
    });

    // Повертаємо успішний статус та замаплений об'єкт
    return NextResponse.json({ 
      success: true, 
      review: {
        id: newFeedbackLog.id,
        user: newFeedbackLog.url,
        text: newFeedbackLog.response,
        rating: newFeedbackLog.status,
        createdAt: newFeedbackLog.createdAt.toISOString()
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error("⚠️ [ API_REVIEWS_POST_CRASH ]:", error);
    return NextResponse.json({ success: false, error: "Помилка сервера при збереженні відгуку" }, { status: 500 });
  }
}
