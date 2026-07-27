"use client";

import React, { useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { Webhook, Save, Key } from "lucide-react";

interface WorkspacePostmanProps {
  isOpen?: boolean;
  onCloseAction?: () => void;
}

export default function WorkspacePostman({ isOpen, onCloseAction }: WorkspacePostmanProps) {
  const { refreshWorkspace, isLoading } = useWorkspace();
  const [targetEvent, setTargetEvent] = useState("PROJECT_COMPLETED");
  const [targetUrl, setTargetUrl] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetEvent,
          targetUrl,
          secretKey: secretKey || null,
          isActive: true,
        }),
      });

      if (res.ok) {
        setTargetUrl("");
        setSecretKey("");
        await refreshWorkspace();
      }
    } catch (err) {
      console.error("Не вдалося зберегти конфігурацію вебхука:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full border border-white/10 bg-neutral-900/40 backdrop-blur-xl p-5 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transition-all duration-300">
      
      {/* Шапка вікна */}
      <div className="flex justify-between items-center border-b border-neutral-800 pb-3 mb-4 select-none">
        <div className="flex items-center gap-2">
          <Webhook className="w-5 h-5 text-violet-400 animate-pulse" />
          <span className="text-sm font-mono text-violet-400 font-black tracking-wider">🚀 WEBHOOK_ORCHESTRATOR v1.0</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 rounded-lg text-violet-400 font-mono font-bold">ШЛЮЗ</span>
          {isOpen && onCloseAction && (
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); onCloseAction(); }}
              className="text-xs font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded-lg hover:bg-red-500 hover:text-white transition cursor-pointer"
            >
              [ × ЗАКРИТИ ]
            </button>
          )}
        </div>
      </div>

      {/* Інженерна форма конфігурації тригерів */}
      <form onSubmit={handleSubmit} className="space-y-4 bg-black/40 p-4 rounded-xl border border-white/5" onClick={(e) => e.stopPropagation()}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-mono text-neutral-400 mb-1.5 uppercase font-bold tracking-wider">Цільовий тригер події</label>
            <select
              value={targetEvent}
              onChange={(e) => setTargetEvent(e.target.value)}
              className="w-full text-sm p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-violet-400 font-mono font-black focus:outline-none focus:border-violet-500 cursor-pointer h-[46px]"
            >
              <option value="PROJECT_COMPLETED">PROJECT_COMPLETED</option>
              <option value="AI_TRIGGER">AI_TRIGGER</option>
              <option value="BUDGET_WARN">BUDGET_WARN</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-neutral-400 mb-1.5 uppercase font-bold tracking-wider">Секретний ключ підпису (SHA-256)</label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••••••••••••••••••••••••••"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="w-full text-sm p-3 pl-9 rounded-xl bg-neutral-950 border border-neutral-800 text-white font-mono focus:outline-none focus:border-violet-500 h-[46px]"
                disabled={isSubmitting}
              />
              <Key className="w-3.5 h-3.5 text-neutral-600 absolute left-3 top-4" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-mono text-neutral-400 mb-1.5 uppercase font-bold tracking-wider">Цільова URL-адреса призначення</label>
          <div className="flex gap-3">
            <input
              type="url"
              placeholder="https://telegram.org... або REST CRM Endpoint шлюзу"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="flex-1 text-sm p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white font-mono focus:outline-none focus:border-violet-500 h-[46px]"
              required
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="px-6 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:brightness-110 text-white font-black text-sm rounded-xl transition font-mono disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-violet-500/10 h-[46px]"
            >
              <Save className="w-4 h-4 shrink-0" />
              <span>ЗБЕРЕГТИ</span>
            </button>
          </div>
        </div>
      </form>

      {/* Комерційна інформаційна нода */}
      <div className="mt-3 flex-1 flex flex-col justify-center items-center bg-neutral-900/20 rounded-xl border border-neutral-800 p-5 border-dashed text-center">
        <span className="text-3xl mb-2 animate-bounce [animation-duration:3s]">🔌</span>
        <p className="text-sm font-mono font-black text-neutral-200">Миттєва low-code синхронізація через Webhook-шлюзи</p>
        <p className="text-xs font-sans text-neutral-500 mt-1.5 max-w-md leading-relaxed">
          Всі зареєстровані правила відправки будуть автоматично рендеритися у сусідній стрічці логів та тригеритися ядром NextOps Engine у повній ізоляції.
        </p>
      </div>
    </div>
  );
}
