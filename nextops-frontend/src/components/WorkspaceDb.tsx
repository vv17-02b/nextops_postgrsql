"use client";

import React, { useState, useEffect } from "react";
import { useProject } from "@/hooks/useProject"; 
import { BarChart3, Database, ChevronRight } from "lucide-react";

interface WorkspaceDbProps {
  isOpen?: boolean;
  onCloseAction?: () => void;
}

export default function WorkspaceDb({ isOpen, onCloseAction }: WorkspaceDbProps): React.JSX.Element {
  const { data: projects, loading } = useProject();
  
  const [logs, setLogs] = useState<string[]>([]);
  const [terminalCmd, setTerminalCmd] = useState<string>("");
  const [executing, setExecuting] = useState<boolean>(false);

  useEffect(() => {
    setLogs([
      "Prisma client v6.19.3 loaded clusters successfully.",
      "Database reactive listener plugged into MongoDB driver.",
      "Type 'db.help()' to view secure core terminal commands."
    ]);
  }, []);

  // Нова універсальна функція для живого фетчингу сутностей з NestJS
  const fetchCollectionStats = async (route: string): Promise<string> => {
    try {
      const res = await fetch(`http://localhost:3001/api/${route}`);
      if (!res.ok) return `Error: Бекенд повернув статус ${res.status}`;
      const json = await res.json();
      const count = Array.isArray(json) ? json.length : 0;
      return `Collection '${route}' fetch active. Documents found in Atlas: ${count}.`;
    } catch {
      return "Error: Не вдалося встановити зв'язок з NestJS сервером.";
    }
  };

  const handleCommand = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!terminalCmd.trim() || executing) return;

    setExecuting(true);
    const stamp: string = new Date().toLocaleTimeString('uk-UA');
    let response = "Error: Command unrecognized by NextOps engine core.";
    const cmd: string = terminalCmd.toLowerCase().trim();

    // Додаємо лог команди користувача на екран негайно
    setLogs((prev) => [...prev, `> ${terminalCmd}`]);

    // 1. Стандартні системні команди
    if (cmd === "db.status()") {
      response = "MongoDB ATLAS cluster active. State: CONNECTED // IO_BOUND_THREADS: OK.";
    } else if (cmd === "db.stats()") {
      response = `Collections cached: 15 Core Modules active. Active Projects in Atlas: ${projects.length}.`;
    } else if (cmd === "db.help()") {
      response = "Available cluster commands:\n - 'db.status()'\n - 'db.stats()'\n - 'db.[entity].findMany()' (напр. db.order.findMany(), db.product.findMany())\n - 'clear'";
    } else if (cmd === "clear") {
      setLogs([]);
      setTerminalCmd("");
      setExecuting(false);
      return;
    } 
    // 2. 🚀 НОВА ФІЧА: Інтелектуальний динамічний парсер NoSQL команд для 15 модулів
    else if (cmd.startsWith("db.") && cmd.endsWith(".findmany()")) {
      // Вирізаємо назву сутності з рядка типу "db.orderitem.findMany()"
      const entity = cmd.substring(3, cmd.length - 11).trim();
      
      const validEntities = [
        "account", "user", "product", "order", "orderitem", "category", 
        "warehouse", "review", "session", "verificationtoken", 
        "webhookconfig", "apihistory", "project", "agentknowledgebase", "useraibudget"
      ];

      if (validEntities.includes(entity)) {
        response = await fetchCollectionStats(entity);
      } else {
        response = `Error: Колекцію '${entity}' не знайдено у схемі NextOps Cores.`;
      }
    }

    setLogs((prev) => [...prev, `[${stamp}] ${response}`]);
    setTerminalCmd("");
    setExecuting(false);
  };

  return (
    <div className="flex flex-col h-full border border-white/10 bg-neutral-900/40 backdrop-blur-xl p-5 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transition-all duration-300">
      
      {/* Шапка вікна */}
      <div className="flex justify-between items-center border-b border-neutral-800 pb-3 mb-4 select-none">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-amber-500" />
          <span className="text-sm font-mono text-amber-500 font-black tracking-wider">LIVE_NOSQL_TERMINAL</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-amber-600/70 font-bold flex items-center gap-1">
            <Database className="w-3.5 h-3.5" /> MONGO_ATLAS
          </span>
          {isOpen && onCloseAction && (
            <button 
              type="button"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onCloseAction(); }}
              className="text-xs font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded-lg hover:bg-red-500 hover:text-white transition cursor-pointer"
            >
              [ × CLOSE ]
            </button>
          )}
        </div>
      </div>

      {/* Системні NoSQL віджети метрик */}
      <div className="grid grid-cols-2 gap-3 mb-4" onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
        <div className="p-3 bg-black/40 rounded-xl border border-neutral-800 text-center font-mono">
          <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-black">Total Projects</p>
          <p className="text-xl font-black text-white mt-1">
            {loading ? "..." : projects.length}
          </p>
        </div>
        <div className="p-3 bg-black/40 rounded-xl border border-neutral-800 text-center font-mono">
          <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-black">Cluster Status</p>
          <p className="text-xl font-black text-amber-400 mt-1">ONLINE</p>
        </div>
      </div>

      {/* Інтерактивний Термінал Клустера */}
      <div className="flex-1 flex flex-col bg-neutral-950/90 rounded-xl border border-neutral-800 p-3 overflow-hidden shadow-inner">
        <div className="flex-1 overflow-y-auto font-mono text-xs text-amber-400/90 space-y-1.5 mb-3 pr-1">
          {logs.map((log, idx) => (
            <p key={idx} className="whitespace-pre-wrap leading-relaxed">{log}</p>
          ))}
        </div>

        <form onSubmit={handleCommand} className="flex gap-2 border-t border-neutral-900 pt-2.5 items-center">
          <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 stroke-[3]" />
          <input
            type="text"
            placeholder="db.order.findMany(), db.product.findMany() або 'db.help()'..."
            value={terminalCmd}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTerminalCmd(e.target.value)}
            disabled={executing}
            className="flex-1 bg-transparent text-white font-mono text-sm focus:outline-none placeholder-neutral-700 disabled:opacity-50"
          />
        </form>
      </div>
    </div>
  );
}
