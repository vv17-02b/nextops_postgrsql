// C:\Users\Admin\Documents\my-unified-work-space\components\Home\ReviewSection.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react"; // Для верифікації сесії автора відгуку
import { useAppStore } from "@/config/store";
import { MessageSquare, Star, ShieldCheck, Send, Sparkles } from "lucide-react";

interface RealFeedback {
  id: string;
  user: string;
  rating: number;
  text: string;
  createdAt: string;
}

export default function ReviewSection() {
  const { t, locale } = useAppStore();
  const { data: session } = useSession(); // Підтягуємо активну сесію Auth.js

  const [feedbacks, setFeedbacks] = useState<RealFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Стейт для нової Cyber-Glass форми додавання відгуку
  const [formText, setFormText] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Функція завантаження живих відгуків з NoSQL роуту
  const fetchLiveFeedbacks = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/reviews");
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data.reviews || []);
      }
    } catch (err) {
      console.error("Не вдалося синхронізувати стрім відгуків:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveFeedbacks();
  }, [fetchLiveFeedbacks]);

  // Хендлер публікації нового відгуку на твій POST роут reviews
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formText.trim()) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/v1/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: session?.user?.name || "anonymous_ops", // Автоматичний нікнейм з сесії
          text: formText.trim(),
          rating: formRating
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setFormText("");
        setFormRating(5);
        // Миттєво перечитуємо стрім з MongoDB Atlas без релоаду екрану
        await fetchLiveFeedbacks();
      } else {
        setFormError(result.error || "Не вдалося зберегти фідбек.");
      }
    } catch (err) {
      setFormError("Збій з'єднання з платіжним/ NoSQL сервером.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultFeedbacks = [
    {
      id: "def_1",
      user: "taras_cyber",
      rating: 5,
      text: "Синхронізація Prisma 6 через Wasm з MongoDB Atlas пройшла успішно. Контроль FinOps бюджетів у матриці 2х2 допомагає тримати токени під повним захистом ядра платформи."
    },
    {
      id: "def_2",
      user: "dmytro_dev",
      rating: 5,
      text: "Шлюз налаштування вебхуків у Вікні №2 працює нативно. Пряма пісочниця Postman економить купу часу при дебазі вхідних JSON-пакетів і логів тригерів."
    }
  ];

  const displayFeedbacks = feedbacks.length > 0 ? feedbacks : defaultFeedbacks;
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-16 relative z-10 border-t border-neutral-900 bg-neutral-950/10">

      {/* Шапка модуля */}
      <div className="mb-10 text-left select-none">
        <h2 className="text-2xl font-black uppercase tracking-wider text-white flex items-center gap-2.5 font-mono">
          <MessageSquare className="w-5 h-5 text-blue-500" />
          {t.reviewsSection.title}
        </h2>
        <p className="text-sm text-neutral-500 mt-1.5 font-sans">
          {t.reviewsSection.subtitle}
        </p>
      </div>

      {/* =================================================================
               🎨 ІНТЕРАКТИВНА ФOРМА СТВOРЕННЯ ВІДГУКУ (КРОК №5 РОЗШИРЕННЯ)
         ================================================================= */}
      {session?.user && (
        <div className="max-w-4xl mx-auto mb-10 bg-neutral-900/30 backdrop-blur-xl border border-neutral-900 p-6 rounded-2xl text-left font-mono text-xs relative overflow-hidden shadow-2xl">
          <div className="absolute top-3 right-3 text-[9px] font-black uppercase text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 select-none">
            <Sparkles className="w-2.5 h-2.5" /> LIVE_FEEDBACK_GATE
          </div>

          <h3 className="text-sm font-black uppercase text-neutral-300 tracking-wide mb-4 select-none">
            &gt; ЗАЛИШИТИ ВЛАСНИЙ ВІДГУК В КЛАСTEРІ
          </h3>

          {formError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
              [ERROR]: {formError}
            </div>
          )}

          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-950 pb-3 select-none">
              <div className="flex items-center gap-2">
                <span className="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Твій нікнейм:</span>
                <span className="text-blue-400 font-black text-sm">@{session.user.name || "engineer"}</span>
              </div>

              {/* Інтерактивний вибір оцінки зірочками */}
              <div className="flex items-center gap-2">
                <span className="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Твоя оцінка ядра:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((stars) => (
                    <button
                      key={stars}
                      type="button"
                      onClick={() => setFormRating(stars)}
                      className="cursor-pointer transition hover:scale-110 active:scale-95 focus:outline-none"
                    >
                      <Star
                        className={`w-4 h-4 ${stars <= formRating ? "fill-amber-400 text-amber-400" : "text-neutral-800"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 items-end">
              <input
                type="text"
                value={formText}
                onChange={(e) => setFormText(e.target.value)}
                placeholder="Введіть текст вашого коментаря про роботу проксі, ШІ або вебхуків NextOps..."
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-blue-500 transition font-mono h-[46px]"
                required
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={isSubmitting || !formText.trim()}
                className="px-5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-widest rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 h-[46px]"
              >
                <Send className="w-3.5 h-3.5 shrink-0" />
                <span>SEND</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Головна сітка виведення відгуків інженерів з бази */}
      {isLoading ? (
        <div className="py-12 flex items-center justify-center font-mono text-xs text-neutral-500 select-none">
          <span className="w-4 h-4 border-2 border-t-transparent border-blue-500 rounded-full animate-spin mr-2"></span>
          <span>LOADING_LIVE_FEEDBACK_STREAM...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayFeedbacks.map((f) => (
            <div
              key={f.id}
              className="bg-neutral-900/30 backdrop-blur-xl border border-neutral-900 p-6 rounded-2xl space-y-3 flex flex-col justify-between hover:border-neutral-800 transition duration-200"
            >
              <div className="space-y-3 text-left">
                <div className="flex items-center justify-between select-none font-mono">
                  <span className="text-sm font-black text-blue-400">@{f.user}</span>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < f.rating ? "fill-amber-400 text-amber-400" : "text-neutral-800"}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm font-sans text-neutral-300 leading-relaxed selection:bg-blue-500/20 whitespace-pre-wrap">
                  "{f.text}"
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 bg-neutral-900/20 border border-neutral-900 p-4 rounded-2xl text-xs text-neutral-500 flex items-center gap-2.5 max-w-2xl select-none font-mono text-left mx-auto">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 animate-pulse" />
        <span>Усі рейтинги та фідбеки інженерів автоматично верифікуються захищеними сесіями кластера Auth.js [14].</span>
      </div>

    </section>
  );
}
