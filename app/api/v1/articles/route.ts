import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Строгий інтерфейс елемента бази даних для повної ліквідації 'any'
interface MockArticleDbItem {
  id: string;
  method: "ARTICLE" | "FEEDBACK";
  url: string;
  response: string;
  headers: string;
  status?: number;
  createdAt: Date;
}

// 1. МЕТОД GET: Зчитування та правильне мапування статей з хмари MongoDB Atlas
export async function GET(): Promise<Response> {
  try {
    const historyModel = prisma.apiHistory as unknown as {
      findMany: (args?: {
        where?: { method?: "ARTICLE" | "FEEDBACK" };
        orderBy?: any;
        take?: number;
      }) => Promise<MockArticleDbItem[]>;
    };

    const articles = await historyModel.findMany({
      where: { method: "ARTICLE" },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const formattedArticles = articles.map((art: MockArticleDbItem) => ({
      id: art.id,
      title: art.url || "Our path to perfection",
      content: art.response || "No content provided",
      author: art.headers || "System Core",
      createdAt: art.createdAt.toISOString(),
    }));

    return NextResponse.json(
      { success: true, articles: formattedArticles },
      { status: 200 },
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error(" [ API_ARTICLES_GET_CRASH ]:", err.message);
    return NextResponse.json(
      { success: false, error: "Помилка кластера при читанні статей" },
      { status: 500 },
    );
  }
}

// 2. МЕТОД POST: Публікація нових маніфестів з розумною адаптацією полів
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const bodyData = await req.json().catch(() => ({}));
    
    // Логування для точного аналізу вхідних даних із CreateContentModal
    console.log(" [ API_ARTICLES_POST_INPUT ]:", bodyData);

    // Розумний мапінг на випадок, якщо фронтенд надсилає альтернативні назви полів (name, text, etc.)
    const title = bodyData.title || bodyData.name || bodyData.url;
    const content = bodyData.content || bodyData.text || bodyData.response;
    const author = bodyData.author || bodyData.headers || bodyData.user || "System Core";

    // Перевірка наявності всіх обов'язкових компонентів після мапінгу
    if (!title || !content || !author) {
      console.warn(" ⚠️ [ API_ARTICLES_POST_400 ]: Валідація провалена. Відсутні обов'язкові поля.", { title, content, author });
      return NextResponse.json(
        { 
          success: false, 
          error: "Всі поля (title, content, author) обов'язкові для заповнення!" 
        },
        { status: 400 },
      );
    }

    // Запис у реальну колекцію ApiHistory в MongoDB Atlas
    const newArticle = await prisma.apiHistory.create({
      data: {
        method: "ARTICLE",
        url: String(title).trim(),
        response: String(content).trim(),
        headers: String(author).trim(),
        status: 201,
      },
    });

    console.log(" [ API_ARTICLES_POST_SUCCESS ]: Статтю успішно збережено в MongoDB Atlas.");

    return NextResponse.json(
      {
        success: true,
        article: {
          id: newArticle.id,
          title: newArticle.url,
          content: newArticle.response,
          author: newArticle.headers,
          createdAt: newArticle.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error(" [ API_ARTICLES_POST_CRASH ]:", err.message);
    return NextResponse.json(
      { success: false, error: "Помилка сервера при публікації" },
      { status: 500 },
    );
  }
}

// 3. МЕТОД DELETE: Безпечне видалення помилкової статті за її NoSQL ID
export async function DELETE(req: NextRequest): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Ідентифікатор статті (id) обов'язковий" },
        { status: 400 },
      );
    }

    const historyModel = prisma.apiHistory as unknown as {
      findUnique: (args: { where: { id: string }; }) => Promise<MockArticleDbItem | null>;
      delete: (args: { where: { id: string } }) => Promise<{ id: string }>;
    };

    const existingArticle = await historyModel.findUnique({
      where: { id },
    });

    if (!existingArticle) {
      return NextResponse.json(
        { success: false, error: "Статтю не знайдено у хмарному кластері" },
        { status: 404 },
      );
    }

    await historyModel.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true, message: "Статтю успішно стерто з репозиторію" },
      { status: 200 },
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error(" [ API_ARTICLES_DELETE_CRASH ]:", err.message);
    return NextResponse.json(
      { success: false, error: "Помилка сервера при видаленні статті" },
      { status: 500 },
    );
  }
}
