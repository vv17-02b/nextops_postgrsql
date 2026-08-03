import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Строгий інтерфейс елемента NoSQL-бази даних
interface MockReviewDbItem {
  id: string;
  method: string;
  url: string;
  response: string;
  headers: string;
  status?: number;
  createdAt: Date;
}

// 🔴 ФІКС БЕЗПЕКИ: Регулярний вираз для перевірки валідності MongoDB ObjectId (строго 24 символи)
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

/**
 * 1. МЕТОД GET: Зчитування, фільтрація та динамічний парсинг рейтингу
 */
export async function GET(): Promise<Response> {
  try {
    const historyModel = prisma.apiHistory as unknown as {
      findMany: (args?: {
        where?: { method?: string };
        orderBy?: unknown;
        take?: number;
      }) => Promise<MockReviewDbItem[]>;
    };

    const reviews = await historyModel.findMany({
      where: { method: "FEEDBACK" },
      orderBy: { createdAt: "desc" },
      take: 12,
    });

    const formattedReviews = reviews.map((rev: MockReviewDbItem) => {
      let parsedRating = 5;

      if (rev.status && rev.status >= 1 && rev.status <= 5) {
        parsedRating = rev.status;
      } else if (rev.headers && !rev.headers.startsWith("{")) {
        const potentialRating = parseInt(rev.headers.trim(), 10);
        if (!isNaN(potentialRating) && potentialRating >= 1 && potentialRating <= 5) {
          parsedRating = potentialRating;
        }
      }

      return {
        id: rev.id,
        user: rev.url && !rev.url.startsWith("http") ? rev.url : "anonymous_ops",
        rating: parsedRating,
        text: rev.response || "Система працює відмінно.",
        createdAt: rev.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ success: true, reviews: formattedReviews }, { status: 200 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("❌ [ API_REVIEWS_GET_CRASH ]:", err.message);
    return NextResponse.json({ success: false, error: "Помилка кластера при читанні відгуків" }, { status: 500 });
  }
}

/**
 * 2. МЕТОД DELETE: Безпечне видалення відгуку з MongoDB Atlas за його NoSQL ID
 */
export async function DELETE(req: NextRequest): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Ідентифікатор відгуку (id) обов'язковий" }, { status: 400 });
    }

    // 🔴 ФІКС КРАШУ: Якщо це дефолтна заглушка фронтенду (не ObjectId), імітуємо успішне видалення
    if (!OBJECT_ID_REGEX.test(id)) {
      console.log(`⚠️ [API_REVIEWS_DELETE]: Видалено локальну картку-заглушку: ${id}. Запит до БД скасовано.`);
      return NextResponse.json({ 
        success: true, 
        message: "Статичний локальний запис успішно приховано з інтерфейсу" 
      }, { status: 200 });
    }

    const historyModel = prisma.apiHistory as unknown as {
      findUnique: (args: { where: { id: string }; }) => Promise<MockReviewDbItem | null>;
      delete: (args: { where: { id: string } }) => Promise<{ id: string }>;
    };

    const existingReview = await historyModel.findUnique({ where: { id } });

    if (!existingReview) {
      return NextResponse.json({ success: false, error: "Запис не знадено у хмарі Atlas" }, { status: 404 });
    }

    await historyModel.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Запис успішно видалено з логів" }, { status: 200 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error(" [ API_REVIEWS_DELETE_CRASH ]:", err.message);
    return NextResponse.json({ success: false, error: "Помилка сервера при видаленні запису" }, { status: 500 });
  }
}
