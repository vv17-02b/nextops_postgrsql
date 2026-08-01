import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Суворі інтерфейси для уніфікованого результату пошуку
interface UnifiedSearchResult {
  id: string;
  source: "LOCAL_DATABASE" | "WIKIPEDIA" | "GOOGLE";
  title: string;
  snippet: string;
  link: string;
}

// Інтерфейс для безпечного парсингу результатів проектів з нашої Mock-бази
interface MockProjectSearchItem {
  id: string;
  name: string;
  budget: number;
  status: string;
}

// Інтерфейс для безпечного парсингу результатів Wikipedia API
interface WikipediaSearchPage {
  pageid: number;
  title: string;
  extract?: string;
  fullurl?: string;
}

// Інтерфейс для безпечного парсингу результатів Google API
interface GoogleSearchItem {
  title?: string;
  snippet?: string;
  link?: string;
}

export async function GET(req: NextRequest): Promise<Response> {
  try {
    // 1. БЕЗПЕКА СЕСІЇ: Перевіряємо авторизацію інженера
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Отримуємо та валідуємо пошуковий запит
    const { searchParams } = new URL(req.url);
    const query = String(searchParams.get("query") || "").trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ success: false, error: "Пошуковий запит має містити мінімум 2 символи" }, { status: 400 });
    }

    // 2. ОРКЕСТРАЦІЯ ПОТОКІВ ПОШУКУ (Паралельний Promise.all пул)
    const [localResults, wikiResults, googleResults] = await Promise.all([
      searchLocalDatabase(query),
      searchWikipedia(query),
      searchGoogle(query)
    ]);

    // Об'єднуємо всі потоки в єдину реактивну стрічку
    const unifiedFeed: UnifiedSearchResult[] = [...localResults, ...wikiResults, ...googleResults];

    return NextResponse.json({
      success: true,
      query,
      totalFound: unifiedFeed.length,
      results: unifiedFeed
    }, { status: 200 });

  } catch (error: unknown) {
    const err = error as Error;
    console.error("🚨 [UNIFIED_SEARCH_ROUTE_CRASH]:", err.message);
    return NextResponse.json({ success: false, error: "Внутрішня помилка пошукового шлюзу платформи" }, { status: 500 });
  }
}

/**
 *  Потік А: Пошук по локальній NoSQL базі даних MongoDB Atlas (Проєкти)
 */
async function searchLocalDatabase(query: string): Promise<UnifiedSearchResult[]> {
  try {
    // Локально приводимо до типу, де findMany НЕ очікує аргументів, повністю усуваючи баг TS2554
    const projectModel = prisma.project as unknown as {
      findMany: () => Promise<MockProjectSearchItem[]>;
    };

    // ЧИСТИЙ БЕЗАРГУМЕНТНИЙ ВИКЛИК: На 100% задовольняє твій поточний файл lib/prisma.ts
    const projects = await projectModel.findMany();
    
    // Оскільки мок повертає масив, ми нативно фільтруємо його за допомогою JS в оперативній пам'яті
    const filteredProjects = projects.filter((p) => 
      p.name.toLowerCase().includes(query.toLowerCase())
    );

    const formattedProjects: UnifiedSearchResult[] = filteredProjects.map((p) => ({
      id: p.id,
      source: "LOCAL_DATABASE",
      title: `Проєкт Хабу: ${p.name}`,
      snippet: `Поточний статус FinOps ноди: ${p.status}. Виділений бюджет: $${p.budget}`,
      link: `/admin/projects?id=${p.id}`
    }));

    return formattedProjects;
  } catch (dbError) {
    console.warn("⚠️ [SEARCH_LOCAL_DB_WARN]: Локальний пошук тимчасово недоступний", dbError);
    return [];
  }
}

/**
 *  Потік Б: Пошук по всесвітній енциклопедії Wikipedia REST API (100% нативний Fetch)
 */
async function searchWikipedia(query: string): Promise<UnifiedSearchResult[]> {
  try {
    const url = new URL("https://wikipedia.org");
    url.searchParams.append("action", "query");
    url.searchParams.append("format", "json");
    url.searchParams.append("prop", "extracts|info");
    url.searchParams.append("exintro", "true");
    url.searchParams.append("explaintext", "true");
    url.searchParams.append("exchars", "180");
    url.searchParams.append("inprop", "url");
    url.searchParams.append("generator", "search");
    url.searchParams.append("gsrsearch", query);
    url.searchParams.append("gsrlimit", "3");

    const res = await fetch(url.toString(), {
      method: "GET",
      signal: AbortSignal.timeout(4000)
    });

    if (!res.ok) return [];
    
    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) return [];

    const formattedWiki: UnifiedSearchResult[] = Object.values(pages).map((page: unknown) => {
      const p = page as WikipediaSearchPage;
      return {
        id: `wiki_${p.pageid}`,
        source: "WIKIPEDIA",
        title: p.title,
        snippet: p.extract || "Опис статті на Wikipedia відсутній.",
        link: p.fullurl || `https://wikipedia.org{p.pageid}`
      };
    });

    return formattedWiki;
  } catch (wikiError) {
    console.warn(" [SEARCH_WIKIPEDIA_WARN]: Помилка запиту до Wikipedia API");
    return [];
  }
}

/**
 * 🔍 Потік В: Глобальний інтернет-пошук Google Custom Search API (100% нативний Fetch)
 */
async function searchGoogle(query: string): Promise<UnifiedSearchResult[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cxId = process.env.GOOGLE_CX_ID;

  if (!apiKey || !cxId) {
    return [];
  }

  try {
    const url = new URL("https://googleapis.com");
    url.searchParams.append("key", apiKey);
    url.searchParams.append("cx", cxId);
    url.searchParams.append("q", query);
    url.searchParams.append("num", "3");

    const res = await fetch(url.toString(), {
      method: "GET",
      signal: AbortSignal.timeout(4000)
    });

    if (!res.ok) return [];

    const data = await res.json();
    const items = data?.items as GoogleSearchItem[];
    if (!items || !Array.isArray(items)) return [];

    return items.map((item, index) => ({
      id: `google_${Date.now()}_${index}`,
      source: "GOOGLE",
      title: item.title || "Без назви",
      snippet: item.snippet || "Опис результату пошуку Google відсутній.",
      link: item.link || "https://google.com"
    }));

  } catch (googleError) {
    console.warn(" [SEARCH_GOOGLE_WARN]: Помилка запиту до Google API шлюзу");
    return [];
  }
}
