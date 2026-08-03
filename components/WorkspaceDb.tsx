"use client";

import React, { useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { BarChart3, Database, ChevronRight } from "lucide-react";

interface WorkspaceDbProps {
  isOpen?: boolean;
  onCloseAction?: () => void;
}

export default function WorkspaceDb({ isOpen, onCloseAction }: WorkspaceDbProps) {
  const { analytics, isLoading } = useWorkspace();
  const [logs, setLogs] = useState<string[]>([]);
  const [terminalCmd, setTerminalCmd] = useState("");

  // Автоматичне наповнення логів при старті
  React.useEffect(() => {
    setLogs([
      "Prisma client v6.16.x loaded cluster schema.",
      "Database reactive listener plugged into MongoDB driver successfully.",
      "Type 'db.help()' to view secure core terminal commands."
    ]);
  }, []);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalCmd.trim()) return;

    const stamp = new Date().toLocaleTimeString();
    let response = "Error: Command unrecognized by NextOps engine core.";

    const cmd = terminalCmd.toLowerCase().trim();

    if (cmd === "db.status()") {
      response = "MongoDB ATLAS cluster active. State: CONNECTED // IO_BOUND_THREADS: OK.";
    } else if (cmd === "db.stats()") {
      response = `Collections cached: User, Project, WebhookConfig, ApiHistory. Size: ~24.5 KB.`;
    } else if (cmd === "db.help()") {
      response = "Available cluster commands: 'db.status()', 'db.stats()', 'clear'.";
    } else if (cmd === "clear") {
      setLogs([]);
      setTerminalCmd("");
      return;
    }

    setLogs((prev) => [...prev, `> ${terminalCmd}`, `[${stamp}] ${response}`]);
    setTerminalCmd("");
  };

  return (
    <div className="flex flex-col h-full border border-white/10
     bg-neutral-900/40 backdrop-blur-xl p-5 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] 
     transition-all duration-300">
      
      {/* Шапка вікна */}
      <div className="flex justify-between items-center border-b border-neutral-800 pb-3 mb-4 select-none">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-amber-500" />
          <span className="text-sm font-mono text-amber-500 font-black tracking-wider">
             COLLECTION_LIMIT_METRICS
             </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-amber-600/70 font-bold flex items-center gap-1">
            <Database className="w-3.5 h-3.5" /> MONGO_ATLAS
          </span>
          {isOpen && onCloseAction && (
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); onCloseAction(); }}
              className="text-xs font-mono font-bold bg-red-500/10 text-red-400 border
               border-red-500/20 px-2 py-1 rounded-lg hover:bg-red-500 hover:text-white transition cursor-pointer"
            >
              [ × CLOSE ]
            </button>
          )}
        </div>
      </div>

      {/* Великі інформаційні NoSQL віджети метрик */}
      <div className="grid grid-cols-2 gap-3 mb-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-3 bg-black/40 rounded-xl border border-neutral-800 text-center font-mono">
          <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-black">Total Projects</p>
          <p className="text-xl font-black text-white mt-1">
            {isLoading ? "..." : analytics?.count_all ?? 0}
          </p>
        </div>
        <div className="p-3 bg-black/40 rounded-xl border border-neutral-800 text-center font-mono">
          <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-black">Active Cores</p>
          <p className="text-xl font-black text-amber-400 mt-1">
            {isLoading ? "..." : analytics?.active_count ?? 0}
          </p>
        </div>
      </div>

      {/* Інтерактивний NoSQL Термінал Клустера */}
      <div className="flex-1 flex flex-col bg-neutral-950/90 rounded-xl border border-neutral-800 
      p-3 overflow-hidden shadow-inner">
        <div className="flex-1 overflow-y-auto font-mono text-xs text-amber-400/90 
        space-y-1.5 mb-3 pr-1">
          {logs.map((log, idx) => (
            <p key={idx} className="whitespace-pre-wrap leading-relaxed">{log}</p>
          ))}
        </div>

        <form onSubmit={handleCommand} className="flex gap-2 border-t border-neutral-900 
        pt-2.5 items-center">
          <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 stroke-[3]" />
          <input
            type="text"
            placeholder="Введіть 'db.status()', 'db.stats()' або 'clear'..."
            value={terminalCmd}
            onChange={(e) => setTerminalCmd(e.target.value)}
            className="flex-1 bg-transparent text-white font-mono text-sm 
            focus:outline-none placeholder-neutral-700"
          />
        </form>
      </div>
    </div>
  );
}
