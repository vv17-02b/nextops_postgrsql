import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 1. МЕТОД GET: Зчитування та правильне мапування статей з хмари MongoDB Atlas
export async function GET() {
  try {
    const articles = await prisma.apiHistory.findMany({
      where: { method: "ARTICLE" },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const formattedArticles = articles.map((art) => ({
      id: art.id,
      title: art.url || "Our path to perfection",
      content: art.response || "No content provided",
      author: art.headers || "System Core",
      createdAt: art.createdAt.toISOString()
    }));

    return NextResponse.json({ success: true, articles: formattedArticles }, { status: 200 });
  } catch (error) {
    console.error("⚠️ [ API_ARTICLES_GET_CRASH ]:", error);
    return NextResponse.json({ success: false, error: "Помилка кластера при читанні статей" }, { status: 500 });
  }
}

// 2. МЕТОД POST: Публікація нових маніфестів
export async function POST(req: NextRequest) {
  try {
    const bodyData = await req.json().catch(() => ({}));
    const { title, content, author } = bodyData;

    if (!title || !content || !author) {
      return NextResponse.json({ success: false, error: "Всі поля обов'язакові" }, { status: 400 });
    }

    const newArticle = await prisma.apiHistory.create({
      data: {
        userId: "65cb7f4a21de456789abcdef",
        method: "ARTICLE",
        url: title.trim(),
        response: content.trim(),
        headers: author.trim(),
        body: null,
        status: 200
      }
    });

    return NextResponse.json({
      success: true,
      article: {
        id: newArticle.id,
        title: newArticle.url,
        content: newArticle.response,
        author: newArticle.headers,
        createdAt: newArticle.createdAt.toISOString()
      }
    }, { status: 201 });
  } catch (error) {
    console.error("⚠️ [ API_ARTICLES_POST_CRASH ]:", error);
    return NextResponse.json({ success: false, error: "Помилка сервера при публікації" }, { status: 500 });
  }
}

// 3. 🔥 МЕТОД DELETE: Безпечне видалення помилкової статті за її NoSQL ID
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Ідентифікатор статті (id) обов'язковий" }, { status: 400 });
    }

    // Перевіряємо, чи існує цей запис в MongoDB Atlas перед видаленням
    const existingArticle = await prisma.apiHistory.findUnique({
      where: { id }
    });

    if (!existingArticle) {
      return NextResponse.json({ success: false, error: "Статтю не знайдено у хмарному кластері" }, { status: 404 });
    }

    // Видаляємо BSON-документ з колекції ApiHistory
    await prisma.apiHistory.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Статтю успішно стерто з репозиторію" }, { status: 200 });
  } catch (error: any) {
    console.error("⚠️ [ API_ARTICLES_DELETE_CRASH ]:", error);
    return NextResponse.json({ success: false, error: "Помилка сервера при видаленні статті" }, { status: 500 });
  }
}
