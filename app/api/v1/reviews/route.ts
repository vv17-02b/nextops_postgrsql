import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 1. МЕТОД GET: Зчитування та правильне мапування відгуків з хмари MongoDB Atlas
export async function GET() {
  try {
    // Шукаємо в базі документи, які мають маркер FEEDBACK у полі method
    const reviews = await prisma.apiHistory.findMany({
      where: { method: "FEEDBACK" },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // 🔥 ГОЛОВНИЙ ФІКС ТИПІЗАЦІЇ: Явно вказуємо тип 'any' для параметра 'rev'
    // Це повністю усуває помилку 'implicitly has an any type' у збірці Vercel
    const formattedReviews = reviews.map((rev: any) => ({
      id: rev.id,
      user: rev.url || "anonymous",               // Мапимо збережене поле під ім'я
      text: rev.response || "No text provided",   // Мапимо під текст коментаря
      rating: rev.status || 5,                    // Мапимо статус під зірочки рейтингу
      createdAt: rev.createdAt.toISOString()
    }));

    return NextResponse.json({ success: true, reviews: formattedReviews }, { status: 200 });
  } catch (error) {
    console.error("⚠️ [ API_REVIEWS_GET_CRASH ]:", error);
    return NextResponse.json({ success: false, error: "Помилка кластера при читанні відгуків" }, { status: 500 });
  }
}

// 2. МЕТОД POST: Публікація нових відгуків через Постман
export async function POST(req: NextRequest) {
  try {
    const bodyData = await req.json().catch(() => ({}));
    const { user, text, rating } = bodyData;

    if (!user || !text || !rating) {
      return NextResponse.json({ success: false, error: "Всі поля обов'язакові" }, { status: 400 });
    }

    // Записуємо дані у твою універсальну NoSQL модель ApiHistory
    const newReview = await prisma.apiHistory.create({
      data: {
        userId: "65cb7f4a21de456789abcdef", // Дефолтний ObjectId
        method: "FEEDBACK",                 // Наш залізний маркер для відгуків
        url: user.trim(),                   // Записуємо нікнейм у поле url
        response: text.trim(),              // Записуємо текст у поле response
        headers: null,
        body: null,
        status: Number(rating) || 5         // Записуємо оцінку у поле status
      }
    });

    return NextResponse.json({
      success: true,
      review: {
        id: newReview.id,
        user: newReview.url,
        text: newReview.response,
        rating: newReview.status,
        createdAt: newReview.createdAt.toISOString()
      }
    }, { status: 201 });
  } catch (error) {
    console.error("⚠️ [ API_REVIEWS_POST_CRASH ]:", error);
    return NextResponse.json({ success: false, error: "Помилка сервера при публікації відгуку" }, { status: 500 });
  }
}
