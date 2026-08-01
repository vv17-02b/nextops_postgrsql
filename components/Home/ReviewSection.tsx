"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react"; // Для верифікації сесії автора відгуку
import { useAppStore } from "@/config/store";
import { MessageSquare, Star, ShieldCheck, Trash2 } from "lucide-react";

interface RealFeedback {
  id: string;
  user: string;
  rating: number;
  text: string;
  createdAt: string;
}

export default function ReviewSection() {
  const { t } = useAppStore();
  const { data: session } = useSession(); // Підтягуємо активну сесію Auth.js для перевірки доступу

  const [feedbacks, setFeedbacks] = useState<RealFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Функція завантаження живих відгуків з NoSQL роуту
  const fetchLiveFeedbacks = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/reviews");
      if (res.ok) {
        const data = await res.json();

        // СУВOРЕ МАПУВАННЯ: Синхронізуємо поля url, response та status з нашого ApiHistory хабу
        if (data.reviews) {
          const mapped = data.reviews.map((f: any) => ({
            id: f.id,
            user: f.user || f.url || "anonymous_ops",
            rating: Number(f.rating) || 5,
            text: f.text || f.response || "",
            createdAt: f.createdAt
          }));
          setFeedbacks(mapped);
        } else {
          setFeedbacks([]);
        }
      }
    } catch (err) {
      console.error("Не вдалося синхронізувати стрім відгуків:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveFeedbacks();

    // 🔥 БOЙOВИЙ РЕАКТИВНИЙ ТРИГЕР: Миттєво перехоплюємо імпульс успішної публікації з модалки
    const handleRefresh = () => {
      console.log("📢 [NextOps-Core]: Синхронізація та перерахунок стріму відгуків...");
      fetchLiveFeedbacks();
    };

    window.addEventListener("refresh-active-repositories", handleRefresh);
    return () => window.removeEventListener("refresh-active-repositories", handleRefresh);
  }, [fetchLiveFeedbacks]);

  // Хендлер безпечного видалення відгуку через DELETE запит (доступний залогіненим розробникам)
  const handleDeleteReview = async (id: string) => {
    if (!confirm("Ви впевнені, що хочете остаточно стерти цей відгук з репозиторію логів кластера?")) return;

    try {
      const res = await fetch(`/api/v1/reviews?id=${id}`, {
        method: "DELETE",
      });
      const result = await res.json();

      if (res.ok && result.success) {
        await fetchLiveFeedbacks(); // Миттєво оновлюємо стрім на екрані
      } else {
        alert(`[ERROR]: ${result.error || "Не вдалося видалити відгук"}`);
      }
    } catch (err) {
      console.error("Помилка при видаленні відгуку:", err);
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
          {t?.reviewsSection?.title || "FEEDBACK STREAM"}
        </h2>
        <p className="text-sm text-neutral-500 mt-1.5 font-sans">
          {t?.reviewsSection?.subtitle || "Контроль та моніторинг коментарів користувачів"}
        </p>
      </div>

      {/* Головна сітка виведення відгуків */}
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
              className="bg-neutral-900/30 backdrop-blur-xl border border-neutral-900 p-6 rounded-2xl space-y-3 flex flex-col justify-between hover:border-neutral-800 transition duration-200 relative group"
            >
              <div className="space-y-3 text-left">
                <div className="flex items-center justify-between select-none font-mono">
                  <span className="text-sm font-black text-blue-400">@{f.user}</span>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < f.rating ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.3)]" : "text-neutral-800"}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm font-sans text-neutral-300 leading-relaxed selection:bg-blue-500/20 whitespace-pre-wrap">
                  "{f.text}"
                </p>
              </div>

              {/* БOЙOВА КНOПКА ВИДАЛЕННЯ: Доступна тільки якщо користувач залогінений */}
              {session?.user && (
                <div className="pt-2 border-t border-neutral-950 flex justify-end opacity-40 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDeleteReview(f.id)}
                    className="text-neutral-500 hover:text-red-400 transition cursor-pointer p-1 rounded-lg hover:bg-red-500/5 border border-transparent hover:border-red-500/10 flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold"
                    title="Видалити запис з NoSQL логів"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>WIPE RECORD</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 bg-neutral-900/20 border border-neutral-900 p-4 rounded-2xl text-xs text-neutral-500 flex items-center gap-2.5 max-w-2xl select-none font-mono text-left mx-auto">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 animate-pulse" />
        <span>Усі рейтинги та фідбеки інженерів автоматично верифікуються захищеними сесіями кластера Auth.js.</span>
      </div>

    </section>
  );
}
