"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react"; // Для верифікації сесії автора статей
import { useAppStore } from "@/config/store";
import { BookOpen, Calendar, User, ShieldCheck, Trash2, HelpCircle } from "lucide-react";

interface DbArticle {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
}

/**
 *  ІНТЕЛЕКТУАЛЬНИЙ ФРОНТЕНД-ПАРСЕР ЛОГІВ POSTMAN
 * Автоматично очищає сирий JSON-текст від брудних дужок та виводить чистий текст маніфесту
 */
function parseSafeContent(rawContent: string): string {
  if (!rawContent) return "No content provided";
  const trimmed = rawContent.trim();

  // Якщо контент не є JSON-структурою, повертаємо як є
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    return trimmed;
  }

  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;

    // Сценарій А: Усередині логу лежить загорнутий об'єкт article
    if (parsed.article && typeof parsed.article === "object") {
      const nested = parsed.article as Record<string, unknown>;
      if (nested.content) return String(nested.content);
    }

    // Сценарій Б: Об'єкт має прямі поля контенту
    if (parsed.content) return String(parsed.content);
    if (parsed.response) return String(parsed.response);
    if (parsed.message) return String(parsed.message);

    return trimmed;
  } catch {
    return trimmed;
  }
}

export default function BlogStream() {
  const { locale } = useAppStore();
  const { data: session } = useSession(); // Підтягуємо сесію для перевірки доступу до видалення

  const [articles, setArticles] = useState<DbArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Функція синхронізації та завантаження живих статей без any
  const fetchLiveArticles = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/articles");
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error("🚨 [BLOG_STREAM_FETCH_CRASH]:", error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveArticles();

    //  БOЙOВИЙ РЕАКТИВНИЙ ТРИГЕР: Ловимо імпульс відправки форми з модалки навбару
    const handleRefresh = () => {
      console.log("📡 [NextOps-Core]: Синхронізація репозиторію статей з MongoDB...");
      fetchLiveArticles();
    };

    window.addEventListener("refresh-active-repositories", handleRefresh);
    return () => window.removeEventListener("refresh-active-repositories", handleRefresh);
  }, [fetchLiveArticles]);

  // Хендлер безпечного видалення статті через DELETE запит
  const handleDeleteArticle = async (id: string) => {
    const confirmMsg = locale === "ua" 
      ? "Ви впевнені, що хочете стерти цей маніфест з бази?" 
      : "Are you sure you want to delete this manifest?";
    
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/v1/articles?id=${id}`, {
        method: "DELETE",
      });
      const result = await res.json();

      if (res.ok && result.success) {
        // Реактивно оновлюємо масив на фронтенді
        setArticles((prev) => prev.filter((art) => art.id !== id));
      } else {
        alert(`[ERROR]: ${result.error || "Failed to delete"}`);
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Помилка видалення статті:", error.message);
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-16 relative
     z-10 border-t border-neutral-900 bg-neutral-950/10">
      
      {/* Шапка модуля */}
      <div className="mb-10 text-left select-none max-w-4xl mx-auto">
        <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider
         text-white flex items-center gap-2.5 font-mono">
          <BookOpen className="w-5 h-5 text-violet-500" />
          {locale === "ua" ? "Публікації та Маніфести Хабу" : "Platform Hub Publications"}
        </h2>
        <p className="text-xs md:text-sm text-neutral-500 mt-1.5 font-sans">
          {locale === "ua" ? "Останні додані статті розробників ядра NextOps" : "Latest core articles added by system architects"}
        </p>
      </div>

      {/* Головна сітка виведення бойових статей */}
      {isLoading ? (
        <div className="py-12 flex items-center justify-center font-mono text-xs text-neutral-500">
          <span className="w-4 h-4 border-2 border-t-transparent border-violet-500 rounded-full
           animate-spin mr-2"></span>
          <span>SYNC_ARTICLE_REPOSITORIES...</span>
        </div>
      ) : (
        <div className="space-y-6 max-w-4xl mx-auto">
          {articles.length > 0 ? (
            articles.map((art) => {
              // Чистимо та парсимо вміст кожної статті від сирого JSON
              const cleanContent = parseSafeContent(art.content);
              const cleanTitle = art.title && !art.title.startsWith("http") ? art.title : "Маніфест тестування системи NextOps";
              const isPostmanLog = art.author.startsWith("{") || art.author.includes("Proxy");

              return (
                <div
                  key={art.id}
                  className="bg-neutral-900/40 backdrop-blur-xl border
                   border-neutral-900/80 p-5 sm:p-8 rounded-2xl space-y-4 text-left select-text hover:border-neutral-800 transition-all duration-300 relative overflow-hidden group"
                >
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r 
                  from-transparent via-neutral-800 group-hover:via-violet-500/30 to-transparent transition-all"></div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center 
                  justify-between gap-3 border-b border-neutral-950 pb-3 font-mono text-xs text-neutral-500">
                    <h3 className="text-sm sm:text-base font-black text-white
                    uppercase tracking-wide font-mono break-all">
                      &gt; {cleanTitle}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 shrink-0">
                      <span className="flex items-center gap-1.5 text-violet-400 font-medium">
                        <User className="w-3.5 h-3.5 text-violet-500" /> 
                        @{isPostmanLog ? "Postman_Relayer" : art.author}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-neutral-600" /> 
                        {new Date(art.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Рендеринг чистого, красивого відформатованого тексту замість JSON */}
                  <p className="text-xs sm:text-sm font-sans text-neutral-300
                   leading-relaxed whitespace-pre-wrap selection:bg-violet-500/20">
                    {cleanContent}
                  </p>

                  {/* СТАБІЛЬНА ЗOНА КНOПКИ ВИДАЛЕННЯ (Без випадання з контейнера) */}
                  {session?.user && (
                    <div className="pt-3 border-t border-neutral-950/60 flex justify-end 
                    opacity-40 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDeleteArticle(art.id)}
                        className="text-neutral-500 hover:text-red-400 transition-all 
                        cursor-pointer p-1.5 rounded-lg hover:bg-red-500/5 border border-transparent hover:border-red-500/10 flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold"
                        title="Видалити маніфест з репозиторію"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>WIPE MANIFEST</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center border border-dashed border-neutral-900
             rounded-2xl text-neutral-500 italic font-mono text-xs select-none
              bg-neutral-900/5 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
              <HelpCircle className="w-5 h-5 text-neutral-700" />
              <span>Статей у репозиторії бази даних MongoDB Atlas не виявлено...</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 bg-neutral-900/20 border border-neutral-900 
      p-4 rounded-2xl text-xs text-neutral-500 flex items-center gap-2.5 
      max-w-4xl select-none font-mono mx-auto text-left backdrop-blur-sm">
        <ShieldCheck className="w-4 h-4 text-violet-500 shrink-0 id" />
        <span>Усі статті публікуються в реальному часі через Secure Proxy сервери NextOps Engine.</span>
      </div>

    </section>
  );
}
