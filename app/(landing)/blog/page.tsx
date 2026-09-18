"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, PenTool, Globe, Trash2, ShieldAlert } from "lucide-react";

// Інтерфейс об'єкта статті для повної ліквідації брудних типів any
interface Article {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
}

export default function BlogPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Стабільна функція завантаження маніфестів з хмари MongoDB Atlas 
  const fetchArticles = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/articles");
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error(" [FETCH_ARTICLES_ERROR]:", error.message);
    }
  }, []);
  // ==============================================================================
  //  NEXTOPS ENGINE V1.2 // ЦЕНТР ПУБЛІКАЦІЙ (ЧАСТИНА 2 З 4)
  // ==============================================================================

  // Публікація нового маніфесту в головний стрім бази даних
  const handlePublishArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !author.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, author }),
      });
      if (res.ok) {
        setTitle("");
        setContent("");
        setAuthor("");
        await fetchArticles(); // Чиста синхронізація стріму
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error(" [PUBLISH_ARTICLE_ERROR]:", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Примусове стирання маніфесту за допомогою його NoSQL ID
  const handleDeleteArticle = async (id: string) => {
    if (!window.confirm("Примусово стерти цей маніфест з хмари MongoDB Atlas?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/v1/articles?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        // Миттєва реактивна фільтрація масиву на фронтенді
        setArticles((prev) => prev.filter((art) => art.id !== id));
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error("🚨 [DELETE_ARTICLE_ERROR]:", error.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Тригер первинного завантаження при монтуванні сторінки
  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);
  // ==============================================================================
  //  NEXTOPS ENGINE V1.2 // ЦЕНТР ПУБЛІКАЦІЙ (ЧАСТИНА 3 З 4)
  // ==============================================================================

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-6 font-mono text-xs
     relative z-10 selection:bg-blue-500/30 selection:text-white">
      {/* Фоновий кібер-градієнт для глибини інтерфейсу */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full 
      blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 
      rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className="max-w-6xl mx-auto flex flex-col space-y-6 relative z-10">

        {/* НАВБАР ЦЕНТРУ ПУБЛІКАЦІЙ */}
        <div className="flex flex-col sm:flex-row sm:items-center
         justify-between gap-4 border-b border-neutral-900 pb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-violet-400" />
            <span className="text-xs md:text-sm font-black uppercase tracking-wider text-white">
              CORE_PUBLISHING_STATION // ЦЕНТР ПУБЛІКАЦІЙ
            </span>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2
             px-4 py-2.5 text-[11px] font-black uppercase bg-neutral-900/60 
             hover:bg-neutral-850 text-neutral-300 hover:text-white border 
             border-neutral-800 rounded-xl transition cursor-pointer backdrop-blur-md"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-blue-500 font-bold" />
            <span>← BACK_TO_LENDING</span>
          </Link>
        </div>

        {/* АДАПТИВНА МАТРИЦЯ СІТКИ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* ФОРМА СТВОРЕННЯ: КІБЕР-СКЛО ПАНЕЛЬ */}
          <div className="p-5 rounded-2xl border border-neutral-800/80
           bg-neutral-900/40 backdrop-blur-xl h-fit shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r 
            from-transparent via-violet-500/30 to-transparent"></div>
            <h2 className="text-xs font-black text-violet-400 mb-4 uppercase 
            tracking-wider flex items-center gap-1.5">
              <PenTool className="w-4 h-4 text-violet-400" /> NEW_MANIFEST_NODE
            </h2>
            <form onSubmit={handlePublishArticle} className="space-y-4">
              <div>
                <label className="block text-neutral-500 mb-1.5 uppercase font-bold
                 tracking-wider text-[10px]">Автор публікації</label>
                <input
                  type="text"
                  placeholder="Введіть ваше ім'я (наприклад: Vlad)"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full p-3 rounded-xl bg-neutral-950 border 
                  border-neutral-800 text-white focus:outline-none focus:border-violet-500 
                  focus:ring-1 focus:ring-violet-500/20 text-xs font-mono h-[44px] transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-neutral-500 mb-1.5 uppercase font-bold 
                tracking-wider text-[10px]">Заголовок маніфесту</label>
                <input
                  type="text"
                  placeholder="Наприклад: Our path to perfection"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 rounded-xl bg-neutral-950 border 
                  border-neutral-800 text-white focus:outline-none focus:border-violet-500 
                  focus:ring-1 focus:ring-violet-500/20 text-xs font-mono h-[44px] transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-neutral-500 mb-1.5 uppercase font-bold 
                tracking-wider text-[10px]">Вміст публікації</label>
                <textarea
                  placeholder="Введіть текст статті про наполегливість та долання труднощів..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-36 p-3 bg-neutral-950 border border-neutral-800 
                  text-neutral-300 font-mono resize-none focus:outline-none
                   focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 text-xs rounded-xl transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-violet-600
                 via-fuchsia-600 to-blue-600 text-white font-black rounded-xl 
                 uppercase hover:brightness-110 active:scale-[0.99] transition cursor-pointer
                  disabled:opacity-40 flex items-center justify-center gap-2 tracking-widest 
                  shadow-lg shadow-violet-500/10 text-xs"
              >
                <Globe className="w-4 h-4 animate-spin [animation-duration:12s]" />
                <span>{isSubmitting ? "PUBLISHING..." : "PUBLISH_TO_MAIN_STREAM"}</span>
              </button>
            </form>
          </div>
// ==============================================================================
          //  NEXTOPS ENGINE V1.2 // ЦЕНТР ПУБЛІКАЦІЙ 
          // ==============================================================================

          {/* СТРІЧКА ЛОГІВ БАЗИ ДАНИХ (2 КОЛОНКИ НА ДЕСКТОПІ) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xs font-black text-neutral-500 uppercase tracking-wider text-left font-mono px-1">
              LIVE_DATABASE_REPOSITORY_LOGS // МОНІТОР ХМАРИ
            </h2>

            <div className="space-y-3 overflow-y-auto max-h-[75vh] pr-1 scrollbar-thin 
            scrollbar-thumb-neutral-800">
              {articles.length > 0 ? (
                articles.map((art) => (
                  <div key={art.id} className="p-5 rounded-2xl border border-neutral-900
                   bg-neutral-900/10 text-left hover:border-neutral-800/80 transition-all
                    duration-300 relative overflow-hidden group backdrop-blur-md">
                    <div className="absolute top-0 left-0 w-[2px] h-full bg-neutral-800
                     group-hover:bg-blue-500 transition-colors"></div>

                    <div className="flex flex-col sm:flex-row sm:items-center
                     justify-between gap-3 border-b border-neutral-950 pb-2.5 mb-3">
                      <h3 className="font-black text-neutral-200 uppercase text-xs font-mono tracking-wide break-all">
                        &gt; {art.title}
                      </h3>

                      <div className="flex items-center justify-between sm:justify-end
                       gap-4 w-full sm:w-auto border-t sm:border-t-0 border-neutral-950/40 pt-2 sm:pt-0">
                        <span className="text-violet-400 font-bold text-[11px] font-mono shrink-0">
                          By @{art.author}
                        </span>
                        <button
                          onClick={() => handleDeleteArticle(art.id)}
                          disabled={deletingId === art.id}
                          className="px-2.5 py-1.5 rounded-lg bg-red-950/20
                           hover:bg-red-900/40 border border-red-900/30 hover:border-red-500/50
                            text-red-400 hover:text-white transition-all font-mono text-[10px] 
                            font-black cursor-pointer uppercase tracking-wider flex items-center gap-1.5 shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{deletingId === art.id ? "WIPING..." : "WIPE_MANIFEST"}</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-neutral-300 leading-relaxed text-sm whitespace-pre-wrap 
                    font-sans selection:bg-blue-500/40">
                      {art.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center border border-dashed border-neutral-800 rounded-2xl 
                text-neutral-500 italic font-mono bg-neutral-900/5 backdrop-blur-sm flex flex-col 
                items-center justify-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-neutral-600 animate-pulse" />
                  <span>Статей поки що немає в хмарному репозиторії бази даних MongoDB Atlas...</span>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
