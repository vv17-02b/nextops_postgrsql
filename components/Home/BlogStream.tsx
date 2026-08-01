"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react"; // Для верифікації сесії автора статей
import { useAppStore } from "@/config/store";
import { BookOpen, Calendar, User, ShieldCheck, Trash2 } from "lucide-react";

interface DbArticle {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
}

export default function BlogStream() {
  const { locale } = useAppStore();
  const { data: session } = useSession(); // Підтягуємо сесію для перевірки доступу до видалення

  const [articles, setArticles] = useState<DbArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Функція синхронізації та завантаження живих статей
  const fetchLiveArticles = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/articles");
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
      }
    } catch (err) {
      console.error("Не вдалося завантажити репозиторій статей:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveArticles();

    // 🔥 БOЙOВИЙ РЕАКТИВНИЙ ТРИГЕР: Ловимо імпульс відправки форми з модалки навбару
    const handleRefresh = () => {
      console.log("📡 [NextOps-Core]: Синхронізація репозиторію статей з MongoDB...");
      fetchLiveArticles();
    };

    window.addEventListener("refresh-active-repositories", handleRefresh);
    return () => window.removeEventListener("refresh-active-repositories", handleRefresh);
  }, [fetchLiveArticles]);

  // Хендлер безпечного видалення статті через DELETE запит (доступний автору/адміну)
  const handleDeleteArticle = async (id: string) => {
    if (!confirm(locale === "ua" ? "Ви впевнені, що хочете стерти цей маніфест з бази?" : "Are you sure you want to delete this manifest?")) return;

    try {
      const res = await fetch(`/api/v1/articles?id=${id}`, {
        method: "DELETE",
      });
      const result = await res.json();

      if (res.ok && result.success) {
        await fetchLiveArticles(); // Миттєво оновлюємо інтерфейс
      } else {
        alert(`[ERROR]: ${result.error || "Не вдалося видалити статтю"}`);
      }
    } catch (err) {
      console.error("Помилка видалення статті:", err);
    }
  };
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-16 relative z-10 border-t border-neutral-900 bg-neutral-950/10">

      {/* Шапка модуля */}
      <div className="mb-10 text-left select-none">
        <h2 className="text-2xl font-black uppercase tracking-wider text-white flex items-center gap-2.5 font-mono">
          <BookOpen className="w-5 h-5 text-violet-500" />
          {locale === "ua" ? "Публікації та Маніфести Хабу" : "Platform Hub Publications"}
        </h2>
        <p className="text-sm text-neutral-500 mt-1.5 font-sans">
          {locale === "ua" ? "Останні додані статті розробників ядра NextOps" : "Latest core articles added by system architects"}
        </p>
      </div>

      {/* Головна сітка виведення бойових статей */}
      {isLoading ? (
        <div className="py-12 flex items-center justify-center font-mono text-xs text-neutral-500">
          <span className="w-4 h-4 border-2 border-t-transparent border-violet-500 rounded-full animate-spin mr-2"></span>
          <span>SYNC_ARTICLE_REPOSITORIES...</span>
        </div>
      ) : (
        <div className="space-y-6 max-w-4xl mx-auto">
          {articles.length > 0 ? (
            articles.map((art) => (
              <div
                key={art.id}
                className="bg-neutral-900/30 backdrop-blur-xl border border-neutral-900 p-6 sm:p-8 rounded-2xl space-y-4 text-left select-text hover:border-neutral-800 transition duration-300 relative group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-950 pb-3 select-none font-mono text-xs text-neutral-500">
                  <h3 className="text-base font-black text-white uppercase tracking-wide font-mono">&gt; {art.title}</h3>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-violet-500" /> @{art.author}</span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-neutral-600" /> {new Date(art.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <p className="text-sm sm:text-base font-sans text-neutral-300 leading-relaxed whitespace-pre-wrap selection:bg-violet-500/20">
                  {art.content}
                </p>

                {/* БOЙOВА КНOПКА ВИДАЛЕННЯ: Тепер доступна тільки якщо користувач залогінений */}
                {session?.user && (
                  <div className="pt-2 border-t border-neutral-950 flex justify-end opacity-40 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDeleteArticle(art.id)}
                      className="text-neutral-500 hover:text-red-400 transition cursor-pointer p-1 rounded-lg hover:bg-red-500/5 border border-transparent hover:border-red-500/10 flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold"
                      title="Видалити маніфест з репозиторію"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>WIPE MANIFEST</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-12 text-center border border-dashed border-neutral-900 rounded-2xl text-neutral-500 italic font-mono text-xs select-none">
              Статей у репозиторії бази даних MongoDB Atlas не виявлено...
            </div>
          )}
        </div>
      )}

      <div className="mt-8 bg-neutral-900/20 border border-neutral-900 p-4 rounded-2xl text-xs text-neutral-500 flex items-center gap-2.5 max-w-2xl select-none font-mono mx-auto text-left">
        <ShieldCheck className="w-4 h-4 text-violet-500 shrink-0 animate-pulse" />
        <span>Усі статті публікуються в реальному часі через Secure Proxy сервери NextOps Engine.</span>
      </div>

    </section>
  );
}
