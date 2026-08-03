"use client";

import React, { useState } from "react";
import { PenTool, Globe } from "lucide-react";

interface NewArticleFormProps {
  onSuccessRefreshAction: () => Promise<void>;
}

export default function NewArticleForm({ onSuccessRefreshAction }: NewArticleFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);

  const handlePublishArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !author.trim()) return;

    setIsSubmitting(true);
    setUiError(null);

    try {
      const res = await fetch("/api/v1/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, author }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setTitle("");
        setContent("");
        setAuthor("");
        await onSuccessRefreshAction(); // Реактивно оновлюємо серверний стрім статей
      } else {
        setUiError(data.error || "Не вдалося опублікувати маніфест");
      }
    } catch (err) {
      console.error("🚨 [Blog Form Submit Crash]:", err);
      setUiError("Помилка мережі при спробі зв'язку з репозиторієм");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl border border-white/5 bg-neutral-900/40 backdrop-blur-xl h-fit shadow-xl">
      <h2 className="text-xs font-black text-violet-400 mb-4 uppercase tracking-wider flex items-center gap-1.5 font-mono">
        <PenTool className="w-4 h-4 text-violet-400" /> NEW_MANIFEST_NODE
      </h2>

      {uiError && (
        <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-xs rounded-xl">
          ⚠️ {uiError}
        </div>
      )}

      <form onSubmit={handlePublishArticle} className="space-y-4 text-left font-mono">
        <div>
          <label className="block text-neutral-500 mb-1.5 uppercase font-bold tracking-wider text-[10px]">Автор публікації</label>
          <input
            type="text"
            placeholder="Введіть ваше ім'я (наприклад: Vlad)"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-violet-500 text-xs font-mono h-[44px]"
            required
            disabled={isSubmitting}
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black rounded-xl uppercase hover:brightness-115 transition cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2 tracking-widest shadow-lg shadow-violet-500/10 text-xs font-mono"
        >
          {isSubmitting ? (
            <span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
          ) : (
            <Globe className="w-4 h-4" />
          )}
          <span>{isSubmitting ? "PUBLISHING..." : "PUBLISH_TO_MAIN_STREAM"}</span>
        </button>
      </form>
    </div>
  );
}
