"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useAppStore } from "@/config/store";
import { X, Star, Send, Sparkles, BookOpen, MessageSquare, ShieldAlert, Trash2, User } from "lucide-react";

interface CreateContentModalProps {
  isOpen: boolean;
  type: "article" | "review" | null;
  onCloseAction: () => void;
  onSuccessRefreshAction: () => void;
  existingData?: {
    _id: string;
    authorOrUser: string;
    title?: string;
    content?: string;
    rating?: number;
  } | null;
}

interface ArticlePayload {
  title: string;
  content: string;
  author: string;
}

interface ReviewPayload {
  user: string;
  text: string;
  rating: number;
}

export default function CreateContentModal({ 
  isOpen, 
  type, 
  onCloseAction, 
  onSuccessRefreshAction,
  existingData = null 
}: CreateContentModalProps) {
  const { data: session } = useSession();
  const { locale } = useAppStore();

  const [formTitle, setFormTitle] = useState(existingData?.title || "");
  const [formContent, setFormContent] = useState(existingData?.content || "");
  const [formRating, setFormRating] = useState(existingData?.rating || 5);
  const [customAuthor, setCustomAuthor] = useState(existingData?.authorOrUser || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const currentUser = session?.user?.name || "authenticated_developer";
  const isOwner = existingData ? existingData.authorOrUser === currentUser : true;

  if (!isOpen || !type) return null;
  if (!session?.user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md" onClick={onCloseAction} />
        <div className="w-full max-w-sm rounded-2xl border border-red-950 p-6 font-mono text-xs text-center z-10 relative bg-[#140204]">
          <ShieldAlert className="w-8 h-8 text-red-500 mx-auto mb-3 animate-bounce" />
          <p className="text-red-400 font-bold uppercase tracking-wider">[ ACCESS_DENIED ]</p>
          <p className="text-neutral-400 mt-2">Публікація дозволена тільки верифікованим клієнтам платформи.</p>
          <button onClick={onCloseAction} className="mt-4 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-bold cursor-pointer">Закрити шлюз</button>
        </div>
      </div>
    );
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (type === "article" && (!formTitle.trim() || !formContent.trim())) return;
    if (type === "review" && !formContent.trim()) return;

    setIsSubmitting(true);
    setFormError(null);

    const targetRoute = type === "article" ? "/api/v1/articles" : "/api/v1/reviews";
    const authorName = isOwner && customAuthor.trim() ? customAuthor.trim() : currentUser;

    const payload: ArticlePayload | ReviewPayload = type === "article"
      ? { title: formTitle.trim(), content: formContent.trim(), author: authorName }
      : { user: authorName, text: formContent.trim(), rating: formRating };

    try {
      const method = existingData ? "PUT" : "POST";
      const finalRoute = existingData ? `${targetRoute}/${existingData._id}` : targetRoute;

      const res = await fetch(finalRoute, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setFormTitle("");
        setFormContent("");
        setFormRating(5);
        setCustomAuthor("");
        onSuccessRefreshAction();
        onCloseAction();
      } else {
        setFormError(result.error || "Не вдалося зберегти запис у NoSQL кластері.");
      }
    } catch (err) {
      setFormError("Збій маршрутизації HTTP-запиту.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingData || !isOwner) return;
    if (!confirm("Ви впевнені, що хочете видалити цю публікацію?")) return;

    setIsSubmitting(true);
    setFormError(null);

    const targetRoute = type === "article" ? `/api/v1/articles/${existingData._id}` : `/api/v1/reviews/${existingData._id}`;

    try {
      const res = await fetch(targetRoute, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });

      const result = await res.json();

      if (res.ok && result.success) {
        onSuccessRefreshAction();
        onCloseAction();
      } else {
        setFormError(result.error || "Не вдалося видалити запис з NoSQL кластеру.");
      }
    } catch (err) {
      setFormError("Збій маршрутизації під час видалення.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className=" inset-0 z-50 flex items-center justify-center p-4">
      <div className=" bg-neutral-950/60 backdrop-blur-md" onClick={onCloseAction} />
      
      <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-[#0c0c0e]/90 p-6 font-mono text-xs z-10 relative shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-4">
          <div className="flex items-center gap-2 text-neutral-200 font-bold uppercase tracking-wider">
            {type === "article" ? <BookOpen className="w-4 h-4 text-cyan-400" /> : <MessageSquare className="w-4 h-4 text-amber-400" />}
            <span>{existingData ? "Редагування публікації" : `Створення ${type === "article" ? "статті" : "відгуку"}`}</span>
          </div>
          <button onClick={onCloseAction} className="p-1 rounded-lg hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isOwner && (
            <div>
              <label className="text-neutral-400 mb-1 uppercase tracking-tight flex items-center gap-1">
                <User className="w-3 h-3 text-neutral-500" /> Змінити автора публікації:
              </label>
              <input
                type="text"
                value={customAuthor}
                onChange={(e) => setCustomAuthor(e.target.value)}
                placeholder={currentUser}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-neutral-700 transition-colors"
              />
            </div>
          )}

          {type === "article" && (
            <div>
              <label className="block text-neutral-400 mb-1 uppercase tracking-tight">Назва статті:</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-cyan-500 transition-colors"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-neutral-400 mb-1 uppercase tracking-tight">Контент / Текст:</label>
            <textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              rows={5}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-neutral-700 transition-colors resize-none"
              required
            />
          </div>

          {type === "review" && (
            <div>
              <label className="block text-neutral-400 mb-1 uppercase tracking-tight">Рейтинг (1-5):</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormRating(star)}
                    className="p-1 transition-transform active:scale-95"
                  >
                    <Star className={`w-5 h-5 ${star <= formRating ? "text-amber-400 fill-amber-400" : "text-neutral-600"}`} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {formError && (
            <p className="text-red-500 border border-red-950 bg-red-950/20 p-2 rounded-xl text-center">
              {formError}
            </p>
          )}

          <div className="flex gap-2 pt-2 border-t border-neutral-800">
            {existingData && isOwner && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-900 rounded-xl text-red-400 font-bold transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Видалити
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? "Обробка..." : existingData ? "Зберегти зміни" : "Опублікувати"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
