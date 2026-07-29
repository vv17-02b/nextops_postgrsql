// C:\Users\Admin\Documents\my-unified-work-space\components\WorkspaceProject.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { Cpu, Plus, Layers, Filter, MessageSquare, Send } from "lucide-react";

interface WorkspaceProjectProps {
  isOpen?: boolean;
  onCloseAction?: () => void;
}

export default function WorkspaceProject({ isOpen, onCloseAction }: WorkspaceProjectProps) {
  const { projects, activeProject, setActiveProject, refreshWorkspace, isLoading } = useWorkspace();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // ==========================================
  // СТАН ТА ЛОГІКА ДЛЯ ЖИВОГО ШІ-ЧАТУ
  // ==========================================
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Автоматичний скрол чату до найсвіжішого повідомлення
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiLoading]);

  // Очищення історії чату, якщо користувач перемкнув ШІ-агента
  useEffect(() => {
    setMessages([]);
    setChatInput("");
  }, [activeProject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          budget: parseFloat(budget) || 0.0,
          status: "PLANNING",
        }),
      });

      if (res.ok) {
        setTitle("");
        setDescription("");
        setBudget("0");
        await refreshWorkspace();
      }
    } catch (err) {
      console.error("Не вдалося створити проект ШІ:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔥 ОНОВЛЕНЕ КУЛЕНЕПРОБИВНЕ SSE-ЯДРО ЧИТАННЯ ПОТОКУ ТОКЕНІВ (СТАНДАРТ V2.0)
  const handleSendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isAiLoading || !activeProject) return;

    const userMessage = { role: "user" as const, content: chatInput };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setChatInput("");
    setIsAiLoading(true);

    // Додаємо порожній блок для майбутнього потоку відповіді ШІ
    setMessages((prev) => [...prev, { role: "assistant" as const, content: "" }]);

    try {
      const res = await fetch("/api/v1/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          projectId: activeProject.id,
        }),
      });

      if (!res.ok) throw new Error("Помилка зв'язку з автономним ядром");
      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      let buffer = ""; // Буфер для збирання розірваних мережевих пакетів

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        // Декодуємо черговий чанк байтів і додаємо до буфера
        buffer += decoder.decode(value, { stream: true });

        // Розбиваємо буфер на окремі SSE лінії
        const lines = buffer.split("\n");
        // Залишаємо останній (можливо незавершений) рядок у буфері
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine.includes("[DONE]")) continue;

          // Перевіряємо відповідність індустріальному стандарту SSE
          if (trimmedLine.startsWith("data: ")) {
            const token = trimmedLine.replace("data: ", "");
            accumulatedText += token;

            // Миттєво оновлюємо інтерфейс (Ефект живого посимвольного друку)
            setMessages((prev) => {
              const newMsgs = [...prev];
              if (newMsgs.length > 0) {
                newMsgs[newMsgs.length - 1] = { role: "assistant", content: accumulatedText };
              }
              return newMsgs;
            });
          }
        }
      }

      // Обробляємо залишок буфера, якщо він залишився
      if (buffer.trim().startsWith("data: ")) {
        accumulatedText += buffer.trim().replace("data: ", "");
        setMessages((prev) => {
          const newMsgs = [...prev];
          if (newMsgs.length > 0) {
            newMsgs[newMsgs.length - 1] = { role: "assistant", content: accumulatedText };
          }
          return newMsgs;
        });
      }

      await refreshWorkspace();

    } catch (err: any) {
      console.error(" Помилка клієнтського потоку ШІ:", err);
      setMessages((prev) => {
        const newMsgs = [...prev];
        if (newMsgs.length > 0) {
          newMsgs[newMsgs.length - 1] = {
            role: "assistant",
            content: `[CRASH_ERROR]: Виникла помилка синхронізації з ядром: ${err.message}`
          };
        }
        return newMsgs;
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const filteredProjects = projects.filter(p => filterStatus === "ALL" || p.status === filterStatus);

  return (
    <div className="flex flex-col h-full border border-white/10 bg-neutral-900/40 backdrop-blur-xl p-5 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transition-all duration-300 overflow-hidden">

      {/* Шапка вікна */}
      <div className="flex justify-between items-center border-b border-neutral-800 pb-3 mb-4 select-none shrink-0">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400 animate-spin [animation-duration:8s]" />
          <span className="text-sm font-mono text-cyan-400 font-black tracking-wider">🤖 AGENT_ORCHESTRATOR v1.2</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-lg text-cyan-400 font-mono font-bold">
            {isLoading ? "SYNC..." : "CLUSTER_ONLINE"}
          </span>
          {isOpen && onCloseAction && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onCloseAction(); }}
              className="text-xs font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded-lg hover:bg-red-500 hover:text-white transition cursor-pointer"
            >
              [ × CLOSE ]
            </button>
          )}
        </div>
      </div>

      {/* Головний контейнер з прокруткою */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">

        {/* Інженерна форма створення */}
        <form onSubmit={handleSubmit} className="space-y-3 bg-black/40 p-4 rounded-xl border border-white/5" onClick={(e) => e.stopPropagation()}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Назва ШІ-Агента / Проєкту"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 text-white focus:outline-none focus:border-cyan-500 font-mono transition shadow-inner"
              required
            />
            <input
              type="text"
              placeholder="Контекст та Опис логіки"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 text-white focus:outline-none focus:border-cyan-500 font-mono transition shadow-inner"
            />
          </div>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-3.5 text-sm font-mono text-neutral-500 font-bold">$</span>
              <input
                type="number"
                step="0.01"
                placeholder="Комерційний ліміт токенів (Бюджет)"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full text-sm p-3 pl-8 rounded-xl bg-neutral-950/80 border border-neutral-800 text-emerald-400 focus:outline-none focus:border-cyan-500 font-mono font-black transition shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:brightness-110 text-neutral-950 font-black text-sm rounded-xl transition font-mono disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/10"
            >
              <Plus className="w-4 h-4 shrink-0 stroke-[3]" />
              <span>DEPLOY</span>
            </button>
          </div>
        </form>

        {/* Панель сортування */}
        <div className="flex items-center justify-between gap-4 px-1 select-none font-mono text-xs text-neutral-400" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-neutral-500" />
            <span>Фільтр ядра:</span>
            {["ALL", "PLANNING", "ACTIVE"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-2 py-0.5 rounded border transition cursor-pointer ${filterStatus === st ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 font-bold" : "border-neutral-800 text-neutral-500 hover:text-white"}`}
              >
                {st}
              </button>
            ))}
          </div>
          <div className="hidden sm:block">
            <span>Поточне навантаження: <span className="text-cyan-400 font-bold">{projects.length}/10 нод</span></span>
          </div>
        </div>

        {/* Список NoSQL документів */}
        <div className="space-y-2">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((proj) => (
              <div
                key={proj.id}
                onClick={(e) => { e.stopPropagation(); setActiveProject(proj); }}
                className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${activeProject?.id === proj.id
                  ? "border-cyan-500 bg-cyan-950/20 shadow-lg shadow-cyan-500/5"
                  : "border-neutral-800 bg-neutral-900/30 hover:border-neutral-700 hover:bg-neutral-900/50"
                  }`}
              >
                <div className="truncate flex-1 pr-3">
                  <div className="flex items-center gap-2 truncate">
                    <Layers className={`w-3.5 h-3.5 ${activeProject?.id === proj.id ? "text-cyan-400" : "text-neutral-500"}`} />
                    <p className="text-sm font-mono font-black text-white truncate">{proj.title}</p>
                  </div>
                  <p className="text-xs font-sans text-neutral-400 mt-1 truncate pl-5.5">
                    {proj.description || "Опис системних інструкцій відсутній"}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-1.5 shrink-0 select-none">
                  <span className="text-sm font-mono font-black text-emerald-400">${proj.budget.toFixed(2)}</span>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md border font-black uppercase tracking-wider ${proj.status === "ACTIVE"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                    {proj.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center text-sm font-mono text-neutral-500 italic py-12 bg-black/20 rounded-xl border border-dashed border-neutral-800">
              <span>Проєктів за обраним фільтром не знайдено</span>
            </div>
          )}
        </div>

        {/* 💬 ДІАЛОГОВИЙ ТЕРМІНАЛ ШІ-ЯДРА */}
        {activeProject && (
          <div className="mt-4 bg-neutral-950/60 border border-cyan-500/20 rounded-xl p-4 space-y-3 font-mono" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-bold uppercase tracking-wider select-none pb-2 border-b border-neutral-900">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Діалоговий термінал ноди: {activeProject.title}</span>
            </div>

            {/* Зона повідомлень чату */}
            <div className="h-44 overflow-y-auto space-y-2 p-2 rounded-lg bg-black/40 text-xs border border-white/5">
              {messages.length === 0 && (
                <div className="h-full flex items-center justify-center text-neutral-600 italic select-none">
                  Термінал готовий до роботи. Надішліть першу команду...
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={`p-2.5 rounded-lg max-w-[85%] border ${msg.role === "user"
                  ? "bg-cyan-950/30 border-cyan-500/20 ml-auto text-right text-cyan-200"
                  : "bg-neutral-900/60 border-neutral-800 text-neutral-300"
                  }`}>
                  <span className="text-[9px] block opacity-40 uppercase font-black mb-0.5">
                    {msg.role === "user" ? "Client_Request" : "Agent_Payload"}
                  </span>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              ))}
              {isAiLoading && messages[messages.length - 1]?.content === ""}
              <div ref={chatEndRef} />
            </div>

            {/* Поле введення */}
            <form onSubmit={handleSendAiMessage} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Введіть команду або запит до ШІ..."
                disabled={isAiLoading}
                className="flex-1 text-xs p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50 transition"
              />
              <button
                type="submit"
                disabled={isAiLoading || !chatInput.trim()}
                className="px-4 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-black rounded-xl transition disabled:opacity-30 flex items-center justify-center cursor-pointer min-w-[44px]"
              >
                <Send className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
