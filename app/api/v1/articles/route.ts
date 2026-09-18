import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Строгий інтерфейс елемента бази даних для повної ліквідації 'any'
interface MockArticleDbItem {
  id: string;
  method: string;
  url: string;
  response: string;
  headers: string;
  status?: number;
  createdAt: Date;
}

/**
 * 🛡️ ФУНКЦІЯ ОЧИЩЕННЯ ТА ПАРСИНГУ ЛОГІВ POSTMAN
 * Розпакує сирий JSON із бази даних і витягне людський текст маніфесту
 */
function cleanArticleContent(rawContent: string): string {
  if (!rawContent) return "No content provided";
  const trimmed = rawContent.trim();
  
  // Якщо контент не схожий на JSON-об'єкт, повертаємо як є
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    return trimmed;
  }

  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    
    // Сценарій А: Всередині логу лежить об'єкт article
    if (parsed.article && typeof parsed.article === "object") {
      const nested = parsed.article as Record<string, unknown>;
      if (nested.content) return String(nested.content);
    }
    
    // Сценарій Б: Об'єкт має пряме поле content або response
    if (parsed.content) return String(parsed.content);
    if (parsed.response) return String(parsed.response);
    if (parsed.message) return String(parsed.message);
    
    return trimmed;
  } catch {
    return trimmed;
  }
}

// 1. МЕТОД GET: Зчитування, фільтрація та інтелектуальне очищення логів маніфестів
export async function GET(): Promise<Response> {
  try {
    const historyModel = prisma.apiHistory as unknown as {
      findMany: (args?: {
        where?: { method?: string };
        orderBy?: unknown;
        take?: number;
      }) => Promise<MockArticleDbItem[]>;
    };

    const articles = await historyModel.findMany({
      where: { method: "ARTICLE" },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const formattedArticles = articles.map((art: MockArticleDbItem) => {
      // Очищаємо вміст та автора від можливого шкідливого напливу JSON-структур Postman
      const safeContent = cleanArticleContent(art.response);
      let safeAuthor = String(art.headers || "System Core").trim();

      if (safeAuthor.startsWith("{")) {
        safeAuthor = "Postman Proxy Engine";
      }

      return {
        id: art.id,
        title: art.url && !art.url.startsWith("http") ? art.url : "Маніфест тестування системи NextOps",
        content: safeContent,
        author: safeAuthor,
        createdAt: art.createdAt.toISOString(),
      };
    });

    return NextResponse.json(
      { success: true, articles: formattedArticles },
      { status: 200 },
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("❌ [ API_ARTICLES_GET_CRASH ]:", err.message);
    return NextResponse.json(
      { success: false, error: "Помилка кластера при читанні статей" },
      { status: 500 },
    );
  }
}

// 2. МЕТОД POST: Публікація нових маніфестів з розумною адаптацією полів
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const bodyData = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    console.log(" [ API_ARTICLES_POST_INPUT ]:", bodyData);

    const title = bodyData.title || bodyData.name || bodyData.url;
    const content = bodyData.content || bodyData.text || bodyData.response;
    const author = bodyData.author || bodyData.headers || bodyData.user || "System Core";

    if (!title || !content || !author) {
      return NextResponse.json(
        { success: false, error: "Всі поля (title, content, author) обов'язкові!" },
        { status: 400 },
      );
    }

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
    console.error("❌ [ API_ARTICLES_POST_CRASH ]:", err.message);
    return NextResponse.json({ success: false, error: "Помилка сервера при публікації" }, { status: 500 });
  }
}

// 3. МЕТОД DELETE: Безпечне видалення помилкової статті за її NoSQL ID
export async function DELETE(req: NextRequest): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Ідентифікатор статті (id) обов'язковий" }, { status: 400 });
    }

    const historyModel = prisma.apiHistory as unknown as {
      findUnique: (args: { where: { id: string }; }) => Promise<MockArticleDbItem | null>;
      delete: (args: { where: { id: string } }) => Promise<{ id: string }>;
    };

    const existingArticle = await historyModel.findUnique({ where: { id } });

    if (!existingArticle) {
      return NextResponse.json({ success: false, error: "Статтю не знайдено у хмарному кластері" }, { status: 404 });
    }

    await historyModel.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Статтю успішно стерто з репозиторію" }, { status: 200 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("❌ [ API_ARTICLES_DELETE_CRASH ]:", err.message);
    return NextResponse.json({ success: false, error: "Помилка сервера при видаленні статті" }, { status: 500 });
  }
}
