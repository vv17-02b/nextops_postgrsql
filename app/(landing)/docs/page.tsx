"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Terminal, Layers, Webhook } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 sm:p-8 font-mono text-xs select-none relative z-10">
      <div className="max-w-4xl mx-auto flex flex-col space-y-6">
        
        {/* Керуючий бар з кнопкою "Назад" */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-violet-400 animate-pulse" />
            <span className="text-sm font-black uppercase tracking-wider text-white">NextOps // API Reference Manifest</span>
          </div>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-black uppercase bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 rounded-xl transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-blue-500 font-bold" />
            <span>← RETURN_TO_HOME</span>
          </Link>
        </div>

        {/* Скляний блок маніфесту */}
        <div className="bg-neutral-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-2xl space-y-4 text-left select-text">
          <h1 className="text-lg font-black text-violet-400 uppercase tracking-widest">&gt; НАТИВНА АРХІТЕКТУРА SAAS ЯДРА</h1>
          <p className="text-neutral-400 leading-relaxed font-sans text-xs">
            NextOps Engine — це високопродуктивна платформа оркестрації, яка використовує ORM Prisma для синхронізації транзитних даних з NoSQL кластерами MongoDB Atlas. Система забезпечує паралельну обробку потоків ШІ-агентів через кастомні ізольовані хуки.
          </p>

          <div className="border-t border-slate-900 pt-4 space-y-4">
            <h3 className="font-black text-white text-xs flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" /> [1.0] ENDPOINT: AGENT MONITOR (GET /api/v1/projects)
            </h3>
            <p className="text-neutral-500 font-sans text-xs">Повертає масив останніх 10 комерційних нод, закріплених за активною сесією розробника.</p>
            <pre className="p-3 bg-black/60 border border-slate-900 rounded-xl text-cyan-400 overflow-x-auto text-[11px]">
{`{
  "success": true,
  "projects": [
    { "id": "65cb7f4a...", "title": "AI_NODE_ALPHA", "budget": 450.00, "status": "ACTIVE" }
  ]
}`}
            </pre>

            <h3 className="font-black text-white text-xs flex items-center gap-2 pt-2">
              <Webhook className="w-4 h-4 text-emerald-500" /> [2.0] ENDPOINT: WEBHOOK DISPATCH (POST /api/v1/webhooks)
            </h3>
            <p className="text-neutral-500 font-sans text-xs">Реєструє нові правила маршрутизації та виклику зовнішніх шлюзів (Telegram API, CRM endpoints).</p>
            <pre className="p-3 bg-black/60 border border-slate-900 rounded-xl text-emerald-400 overflow-x-auto text-[11px]">
{`{
  "targetEvent": "PROJECT_COMPLETED",
  "targetUrl": "https://telegram.org..."
}`}
            </pre>
          </div>
        </div>

        <div className="bg-neutral-900/20 border border-slate-900 p-3 rounded-xl text-neutral-500 flex items-center gap-2 text-left">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Документація автоматично верифікована протоколами шифрування системи.</span>
        </div>

      </div>
    </div>
  );
}
