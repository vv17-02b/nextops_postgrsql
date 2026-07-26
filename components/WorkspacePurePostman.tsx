"use client";

import React, { useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { Terminal, Copy, Check, Radio } from "lucide-react";

interface WorkspacePurePostmanProps {
  isOpen?: boolean;
  onCloseAction?: () => void;
}

export default function WorkspacePurePostman({ isOpen, onCloseAction }: WorkspacePurePostmanProps) {
  const { webhooks, refreshWorkspace } = useWorkspace();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/v1/webhooks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentStatus }),
      });
      if (res.ok) {
        await refreshWorkspace();
      }
    } catch (err) {
      console.error("Не вдалося оновити статус вебхука:", err);
    }
  };

  const handleCopyToClipboard = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full border border-white/10 bg-neutral-900/40 backdrop-blur-xl p-5 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transition-all duration-300">
      
      {/* Шапка вікна */}
      <div className="flex justify-between items-center border-b border-neutral-800 pb-3 mb-4 select-none">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-mono text-emerald-400 font-black tracking-wider">📜 WEBHOOK_DISPATCH_STATION</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 font-mono font-bold flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-500 animate-pulse" /> LIVE CORES
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

      {/* Стрічка логів тригерів */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 h-full min-h-0">
        {webhooks.length > 0 ? (
          webhooks.map((wh) => (
            <div
              key={wh.id}
              className="p-3.5 bg-black/40 rounded-xl border border-neutral-800 flex items-center justify-between text-sm font-mono gap-3 hover:border-neutral-700 transition"
            >
              <div className="truncate flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-black px-2 py-0.5 rounded-md text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20 uppercase tracking-wider">
                    {wh.targetEvent}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${wh.isActive ? "bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" : "bg-neutral-600"}`}></span>
                </div>
                <p className="text-xs text-neutral-400 truncate mt-1.5 font-mono">{wh.targetUrl}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0 select-none">
                {/* Кнопка копіювання адреси */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleCopyToClipboard(wh.id, wh.targetUrl); }}
                  className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
                  title="Copy URL to clipboard"
                >
                  {copiedId === wh.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                {/* Кнопка зміни статусу */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleToggleActive(wh.id, wh.isActive); }}
                  className={`text-[10px] font-black font-mono px-3 py-1.5 rounded-lg transition border cursor-pointer h-[34px] ${
                    wh.isActive
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-neutral-950"
                      : "bg-neutral-900 text-neutral-500 border-neutral-800 hover:bg-neutral-800"
                  }`}
                >
                  {wh.isActive ? "ACTIVE" : "PAUSED"}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-sm font-mono text-neutral-500 italic py-12 bg-black/20 rounded-xl border border-dashed border-neutral-800">
            <span>Активних конфігурацій вебхуків не виявлено в базі MongoDB Atlas</span>
          </div>
        )}
      </div>
    </div>
  );
}
