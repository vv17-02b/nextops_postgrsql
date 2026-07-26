"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, PenTool, Globe, Trash2 } from "lucide-react";

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

  const fetchArticles = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/articles");
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
      }
    } catch (err) {
      console.error("Помилка завантаження нод статей:", err);
    }
  }, []);

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
        await fetchArticles();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!window.confirm("Примусово стерти цей маніфест з хмари MongoDB Atlas?")) return;
    
    setDeletingId(id);
    try {
      const res = await fetch(`/api/v1/articles?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        // 🔥 ВИПРАВЛЕНО: Чиста та сумісна з TypeScript стрілкова функція фільтрації
        setArticles((prev) => prev.filter((art) => art.id !== id));
        await fetchArticles();
      }
    } catch (err) {
      console.error("Помилка видалення ноди:", err);
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 font-mono text-xs relative z-10 select-none">
      <div className="max-w-6xl mx-auto flex flex-col space-y-6">
        
        <div className="flex items-center justify-between border-b border-slate-900 pb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-violet-400" />
            <span className="text-sm font-black uppercase tracking-wider text-white">CORE_PUBLISHING_STATION // ЦЕНТР ПУБЛІКАЦІЙ</span>
          </div>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-black uppercase bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white border border-neutral-800 rounded-xl transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-blue-500 font-bold" />
            <span>← BACK_TO_LENDING</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="p-5 rounded-2xl border border-white/5 bg-neutral-900/40 backdrop-blur-xl h-fit shadow-xl">
            <h2 className="text-xs font-black text-violet-400 mb-4 uppercase tracking-wider flex items-center gap-1.5">
              <PenTool className="w-4 h-4 text-violet-400" /> NEW_MANIFEST_NODE
            </h2>
            <form onSubmit={handlePublishArticle} className="space-y-4">
              <div>
                <label className="block text-neutral-500 mb-1.5 uppercase font-bold tracking-wider text-[10px]">Автор публікації</label>
                <input
                  type="text"
                  placeholder="Введіть ваше ім'я (наприклад: Vlad)"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-violet-500 text-xs font-mono h-[44px]"
                  required
                />
              </div>
              <div>
                <label className="block text-neutral-500 mb-1.5 uppercase font-bold tracking-wider text-[10px]">Заголовок маніфесту</label>
                <input
                  type="text"
                  placeholder="Наприклад: Our path to perfection"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-violet-500 text-xs font-mono h-[44px]"
                  required
                />
              </div>
              <div>
                <label className="block text-neutral-500 mb-1.5 uppercase font-bold tracking-wider text-[10px]">Вміст публікації</label>
                <textarea
                  placeholder="Введіть текст статті про наполегливість та долання труднощів..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-36 p-3 bg-neutral-950 border border-neutral-800 text-neutral-300 font-mono resize-none focus:outline-none focus:border-violet-500 text-xs rounded-xl"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black rounded-xl uppercase hover:brightness-115 transition cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2 tracking-widest shadow-lg shadow-violet-500/10 text-xs"
              >
                <Globe className="w-4 h-4 animate-spin [animation-duration:12s]" />
                <span>{isSubmitting ? "PUBLISHING..." : "PUBLISH_TO_MAIN_STREAM"}</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xs font-black text-neutral-400 mb-1 uppercase tracking-wider text-left font-mono">LIVE_DATABASE_REPOSITORY_LOGS</h2>
            
            <div className="space-y-3 h-full overflow-y-auto max-h-[70vh] pr-1">
              {articles.length > 0 ? (
                articles.map((art) => (
                  <div key={art.id} className="p-5 rounded-2xl border border-neutral-900 bg-neutral-900/20 text-left select-text hover:border-neutral-800 transition relative group">
                    <div className="flex justify-between items-center border-b border-neutral-950 pb-2.5 mb-3 select-none">
                      <h3 className="font-black text-white uppercase text-xs font-mono">&gt; {art.title}</h3>
                      <div className="flex items-center gap-4">
                        <span className="text-violet-400 font-bold text-xs font-mono">By @{art.author}</span>
                        
                        <button
                          onClick={() => handleDeleteArticle(art.id)}
                          disabled={deletingId === art.id}
                          className="px-2 py-1 rounded bg-red-950/40 hover:bg-red-900 border border-red-900/40 hover:border-red-500 text-red-400 hover:text-white transition font-mono text-[10px] font-black cursor-pointer uppercase tracking-wider flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{deletingId === art.id ? "WIPING..." : "DELETE_NODE"}</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-sm whitespace-pre-wrap font-sans">{art.content}</p>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center border border-dashed border-neutral-900 rounded-2xl text-neutral-500 italic font-mono">
                  Статей поки що немає в хмарному репозиторії бази даних MongoDB Atlas...
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
