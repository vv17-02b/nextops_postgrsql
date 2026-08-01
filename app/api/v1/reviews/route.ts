import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;


interface MockReviewDbItem {
  id: string;
  method: "ARTICLE" | "FEEDBACK";
  url: string;
  response: string;
  headers: string;
  status?: number;
  createdAt: Date;
}

// 1. МЕТОД GET: Зчитування відгуків
export async function GET(): Promise<Response> {
  try {
    // Локальне приведення моделі для підтримки розширених аналітичних фільтрів orderBy/take
    const historyModel = prisma.apiHistory as unknown as {
      findMany: (args?: { where?: { method?: "ARTICLE" | "FEEDBACK" }; orderBy?: { createdAt: string }; take?: number }) => Promise<MockReviewDbItem[]>;
    };

    const reviews = await historyModel.findMany({
      where: { method: "FEEDBACK" },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const formattedReviews = reviews.map((rev: MockReviewDbItem) => ({
      id: rev.id,
      user: rev.url || "anonymous",
      text: rev.response || "No text provided",
      rating: Number(rev.status) || 5,
      createdAt: rev.createdAt ? rev.createdAt.toISOString() : new Date().toISOString()
    }));

    return NextResponse.json({ success: true, reviews: formattedReviews }, { status: 200 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error(" [ API_REVIEWS_GET_CRASH ]:", err.message);
    return NextResponse.json({ success: false, error: "Помилка кластера при читанні відгуків" }, { status: 500 });
  }
}
