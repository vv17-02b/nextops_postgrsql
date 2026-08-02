"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { X, FileText, MessageSquare, PlusCircle, ShieldAlert, ShieldCheck } from "lucide-react";

// ФІКС ТИПІВ: Оновлено інтерфейс, додано необов'язкове поле 'type' під конфігурацію Навбару
interface CreateContentModalProps {
  isOpen: boolean;
  type?: "article" | "review" | null;
  onCloseAction: () => void;
  onSuccessRefreshAction?: () => void; // Синхронізація назви колбеку з Навбаром
}

export default function CreateContentModal({ isOpen, type, onCloseAction, onSuccessRefreshAction }: CreateContentModalProps) {
  const { data: session } = useSession();

  // Клієнтські стейти для збору NoSQL контенту
  const [contentType, setContentType] = useState<"ARTICLE" | "FEEDBACK">("ARTICLE");
  const [title, setTitle] = useState("");
  const [authorOrHeader, setAuthorOrHeader] = useState("");
  const [responsePayload, setResponsePayload] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState(5);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // СИНХРOНІЗАЦІЯ З НАВБАРOМ: Автоматично перемикаємо стани форми при відкритті вікна
  useEffect(() => {
    if (isOpen && type) {
      setContentType(type === "article" ? "ARTICLE" : "FEEDBACK");
    }
  }, [isOpen, type]);

  if (!isOpen) return null;

  const userRole = session?.user?.role || "DEVELOPER";
  const isAdmin = userRole === "ADMIN";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setSubmitError("ACCESS_DENIED: Операція додавання контенту дозволена виключно Власнику платформи.");
      return;
    }

    if (!title.trim() || !responsePayload.trim()) {
      setSubmitError("Будь ласка, заповніть усі обов'язкові поля форми.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/v1/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: contentType,
          url: title.trim(),
          headers: authorOrHeader.trim() || (contentType === "ARTICLE" ? "Admin" : "5 зірок"),
          response: responsePayload.trim(),
          status: contentType === "FEEDBACK" ? feedbackStatus : undefined
        }),
      });

      const result = await res.json() as { success?: boolean; error?: string };

      if (res.ok && result.success) {
        setTitle("");
        setAuthorOrHeader("");
        setResponsePayload("");
        if (onSuccessRefreshAction) onSuccessRefreshAction();
        onCloseAction();
      } else {
        setSubmitError(result.error || "Не вдалося зберегти документ у NoSQL кластері.");
      }
    } catch (err) {
      console.error("Помилка створення контенту:", err);
      setSubmitError("Критичний збій зв'язку з сервером бази даних.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    // ФІКС ПОЗИЦІОНУВАННЯ: Додано фіксований оверлей fixed inset-0 та z-[999] для абсолютного центру поверх Навбара
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-neutral-950/80 backdrop-blur-xl p-4 animate-fadeIn select-none">
      
      {/* Клієнтська Cyber-Glass картка вікна */}
      <div className="relative w-full max-w-lg bg-neutral-900/90 border border-white/10 rounded-2xl p-6 shadow-[0_30px_100px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh] overflow-y-auto text-white transition-all duration-300">
        
        {/* Кнопка закриття модального вікна */}
        <button 
          type="button"
          onClick={onCloseAction}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer active:scale-95 z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Заголовок панелі управління контентом */}
        <div className="mb-5 border-b border-neutral-800 pb-3 select-none">
          <h2 className="text-sm font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5 font-mono">
            <PlusCircle className="w-4 h-4" /> ГЕНЕРАЦІЯ НОВОГО NOSQL ДОКУМЕНТА
          </h2>
          <p className="text-[10px] text-neutral-500 mt-1 font-mono">
            Пряме логування публікацій та відгуків у кластер інфраструктури NextOps Engine
          </p>
        </div>

        {/* Захисний екран-заглушка для сторонніх користувачів */}
        {!isAdmin ? (
          <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col items-center text-center gap-2 select-none font-mono">
            <ShieldAlert className="w-6 h-6 text-red-400 animate-pulse" />
            <p className="text-xs font-bold uppercase text-neutral-200">ДОСТУП ЗАБОРОНЕНО</p>
            <p className="text-[11px] text-neutral-500 max-w-xs leading-relaxed">
              Цей інструментарій управління доступний виключно легальному Власнику платформи за валідацією сесії.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left font-mono text-xs">
            {submitError && (
              <p className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] rounded-lg">
                {submitError}
              </p>
            )}

            {/* Перемикач типу ноди контенту (ARTICLE або FEEDBACK) */}
            <div>
              <label className="block text-[9px] text-neutral-500 uppercase font-black mb-1.5 select-none tracking-wider">Тип NoSQL Ноди</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setContentType("ARTICLE")}
                  className={`py-2.5 text-[10px] font-bold rounded-lg border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    contentType === "ARTICLE" 
                      ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 font-black" 
                      : "bg-neutral-950 border-neutral-850 text-neutral-500 hover:text-white"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> СТАТТЯ БЛОГУ
                </button>
                <button
                  type="button"
                  onClick={() => setContentType("FEEDBACK")}
                  className={`py-2.5 text-[10px] font-bold rounded-lg border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    contentType === "FEEDBACK" 
                      ? "bg-purple-500/10 border-purple-500/30 text-purple-400 font-black" 
                      : "bg-neutral-950 border-neutral-850 text-neutral-500 hover:text-white"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" /> ВІДКУК КЛІЄНТА
                </button>
              </div>
            </div>

            {/* Динамічні інпути збору даних */}
            <div>
              <label className="block text-[9px] text-neutral-500 uppercase font-black mb-1 select-none tracking-wider">
                {contentType === "ARTICLE" ? "Заголовок публікації" : "Ім'я автора відгуку"}
              </label>
              <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-850 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono h-[38px] shadow-inner"
                required
                placeholder={contentType === "ARTICLE" ? "Наприклад: Оптимізація FinOps..." : "Наприклад: Олександр К. (CEO)"}
              />
            </div>

            <div>
              <label className="block text-[9px] text-neutral-500 uppercase font-black mb-1 select-none tracking-wider">
                {contentType === "ARTICLE" ? "Автор / Спікер" : "Мета-підпис (Рейтинг)"}
              </label>
              <input 
                type="text"
                value={authorOrHeader}
                onChange={(e) => setAuthorOrHeader(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-850 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono h-[38px] shadow-inner"
                placeholder={contentType === "ARTICLE" ? "Введіть ім'я автора..." : "Наприклад: 5 зірок"}
              />
            </div>

            {/* Вибір оцінки зірок тільки для типу FEEDBACK */}
            {contentType === "FEEDBACK" && (
              <div>
                <label className="block text-[9px] text-neutral-500 uppercase font-black mb-1 select-none tracking-wider">Рейтинг (1-5 зірок)</label>
                <select
                  value={feedbackStatus}
                  onChange={(e) => setFeedbackStatus(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-850 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono h-[38px] cursor-pointer shadow-inner"
                >
                  {[5, 4, 3, 2, 1].map((num) => (
                    <option key={num} value={num} className="bg-neutral-950 text-white">{num} ★</option>
                  ))}
                </select>
              </div>
            )}

            {/* Поле введення контенту */}
            <div>
              <label className="block text-[9px] text-neutral-500 uppercase font-black mb-1 select-none tracking-wider">Основний Payload (Текст контенту)</label>
              <textarea 
                rows={4}
                value={responsePayload}
                onChange={(e) => setResponsePayload(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-850 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono resize-none leading-relaxed shadow-inner"
                required
                placeholder="Введіть вміст публікації або текст відгуку..."
              />
            </div>

            {/* Кнопки керування мутацією */}
            <div className="flex gap-2 pt-3 border-t border-neutral-800">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 disabled:opacity-40 text-neutral-950 font-black rounded-xl uppercase tracking-wider text-[10px] transition cursor-pointer shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-1.5 active:scale-[0.99]"
              >
                {isSubmitting ? "STORING_DATA..." : "EXECUTE_NOSQL_INSERT"}
              </button>
              <button
                type="button"
                onClick={onCloseAction}
                className="px-4 py-2.5 bg-neutral-950 hover:bg-neutral-850 border border-neutral-850 text-neutral-400 rounded-xl text-[10px] font-bold uppercase transition cursor-pointer active:scale-95"
              >
                [ CANCEL ]
              </button>
            </div>
          </form>
        )}

        {/* Футер-підказка */}
        <div className="mt-4 pt-2 border-t border-neutral-800 text-[9px] text-neutral-600 flex items-center gap-1.5 select-none font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/30" />
          <span>Створений документ миттєво запишеться у NoSQL сесію бази даних</span>
        </div>

      </div>
    </div>
  );
}
