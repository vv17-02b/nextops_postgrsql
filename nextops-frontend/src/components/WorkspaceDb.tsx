"use client";

import React, { useEffect, useState, useRef } from "react";
import { BarChart3, Database, ChevronRight, Layers, Cpu } from "lucide-react";
import { apiFetch, getApiHeaders, getApiUrl } from "@/lib/api";
import { readPaginatedCollection } from "@/lib/collections";

interface WorkspaceDbProps {
  isOpen?: boolean;
  onCloseAction?: () => void;
}

const DATABASE_ENTITIES = [
  "account",
  "agentknowledgebase",
  "apihistory",
  "category",
  "order",
  "orderitem",
  "product",
  "project",
  "review",
  "session",
  "user",
  "useraibudget",
  "verificationtoken",
  "warehouse",
  "webhookconfig",
] as const;
const DATABASE_ENTITY_SET = new Set<string>(DATABASE_ENTITIES);

async function fetchEntityRows(entity: string): Promise<unknown[]> {
  const response = await apiFetch(getApiUrl(`/api/${entity}`), {
    headers: getApiHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Backend returned HTTP ${response.status} for '${entity}'.`);
  }

  const { data } = await readPaginatedCollection<unknown>(response);
  return data;
}

function countRows(rows: unknown[]): number {
  return rows.reduce<number>((count) => count + 1, 0);
}

export default function WorkspaceDb({ isOpen, onCloseAction }: WorkspaceDbProps): React.JSX.Element {
  const [logs, setLogs] = useState<{ type: "cmd" | "res"; text: string }[]>([
    { type: "res", text: "PostgreSQL terminal initialized through Prisma and the NestJS API." },
    { type: "res", text: "Type 'db.help()' to view available terminal commands." },
  ]);
  const [terminalCmd, setTerminalCmd] = useState("");
  const [executing, setExecuting] = useState(false);

  // Розширена аналітика (метрики)
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [totalRows, setTotalRows] = useState<number | null>(null);
  const [aiUsage, setAiUsage] = useState<number | null>(null);
  const [databaseOnline, setDatabaseOnline] = useState<boolean | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Автоматичний скрол терміналу вниз при нових записах
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Завантаження початкових глобальних метрик для нових карток
  const updateGlobalMetrics = async (): Promise<void> => {
    try {
      const entityRows = await Promise.all(
        DATABASE_ENTITIES.map((entity) => fetchEntityRows(entity)),
      );

      const rowCount = entityRows.reduce((total, rows) => total + countRows(rows), 0);
      const currentProjects = entityRows[DATABASE_ENTITIES.indexOf("project")];
      const currentAiBudgets = entityRows[DATABASE_ENTITIES.indexOf("useraibudget")] as Array<{
        currentUsageMinor?: number;
      }>;

      setProjectCount(countRows(currentProjects));
      setTotalRows(rowCount);
      setDatabaseOnline(true);

      if (currentAiBudgets && currentAiBudgets.length > 0) {
        const usage = currentAiBudgets.reduce((acc, b) => acc + (b.currentUsageMinor ?? 0), 0);
        setAiUsage(usage / 100);
      } else {
        setAiUsage(0);
      }
    } catch {
      setDatabaseOnline(false);
    }
  };


  useEffect(() => {
    void updateGlobalMetrics();
  }, []);

  const handleCommand = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!terminalCmd.trim() || executing) return;

    const enteredCommand = terminalCmd.trim();
    const command = enteredCommand.toLowerCase();
    const stamp = new Date().toLocaleTimeString();

    setLogs((previous) => [...previous, { type: "cmd", text: enteredCommand }]);
    setTerminalCmd("");

    if (command === "clear") {
      setLogs([]);
      return;
    }

    setExecuting(true);
    try {
      let response: string;

      if (command === "db.help()") {
        response = [
          "Available PostgreSQL-backed API commands:",
          " - db.status()",
          " - db.stats()",
          " - db.[entity].findMany() (for example: db.order.findMany())",
          " - clear",
        ].join("\n");
      } else if (command === "db.status()") {
        const projects = await fetchEntityRows("project");
        setProjectCount(countRows(projects));
        setDatabaseOnline(true);
        response = `PostgreSQL is reachable through Prisma. State: CONNECTED. Project rows: ${countRows(projects)}.`;
      } else if (command === "db.stats()") {
        const entityRows = await Promise.all(
          DATABASE_ENTITIES.map((entity) => fetchEntityRows(entity)),
        );
        const rowCount = entityRows.reduce((total, rows) => total + countRows(rows), 0);
        const currentProjects = entityRows[DATABASE_ENTITIES.indexOf("project")];
        setProjectCount(countRows(currentProjects));
        setTotalRows(rowCount);
        setDatabaseOnline(true);
        response = `PostgreSQL tables queried: ${DATABASE_ENTITIES.length}. Total rows returned: ${rowCount}.`;
      } else {
        const match = /^db\.([a-z]+)\.findmany\(\)$/.exec(command);
        const entity = match?.[1];

        if (!entity || !DATABASE_ENTITY_SET.has(entity)) {
          response = `Error: '${enteredCommand}' is not a supported command or PostgreSQL entity.`;
        } else {
          const rows = await fetchEntityRows(entity);
          response = `PostgreSQL table '${entity}' queried successfully. Rows returned: ${countRows(rows)}.`;
          setDatabaseOnline(true);
          void updateGlobalMetrics();
        }
      }

      setLogs((previous) => [...previous, { type: "res", text: `[${stamp}] ${response}` }]);
    } catch (error: unknown) {
      setDatabaseOnline(false);
      const message = error instanceof Error ? error.message : "Unknown API error.";
      setLogs((previous) => [...previous, { type: "res", text: `[${stamp}] Error: ${message}` }]);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-gray-900/10
     backdrop-blur-md p-4 font-sans shadow-2xl sm:p-5 w-full">

      {/* Шапка компонента (Мінімалізм / Преміум-строгість) */}
      <div className="flex justify-between items-center border-b border-white/5 pb-3 select-none">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-gray-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-200">
            postgresql_console
          </h3>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="text-gray-500">Database status</span>
          <div className="flex items-center gap-1.5 bg-neutral-900 border border-white/5 px-2 py-0.5 rounded">
            <span className={`h-1.5 w-1.5 rounded-full ${databaseOnline === null ? "bg-amber-500" : databaseOnline ? "bg-emerald-500" : "bg-red-500"
              }`} />
            <span className={`text-[10px] font-bold uppercase ${databaseOnline === null ? "text-amber-500" : databaseOnline ? "text-emerald-500" : "text-red-500"
              }`}>
              {databaseOnline === null ? "Checking" : databaseOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>
      </div>


      {/* РОЗШИРЕНИЙ БЛОК МЕТРИК */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-mono text-gray-300">
        <div className="flex justify-between p-2 bg-gray-950/20 rounded border border-white/5">
          <span className="text-gray-400">Project rows</span>
          <span className="font-bold text-white">{projectCount === null ? "..." : projectCount}</span>
        </div>
        <div className="flex justify-between p-2 bg-gray-950/20 rounded border border-white/5">
          <span className="text-gray-400">Total Rows</span>
          <span className="font-bold text-emerald-400">{totalRows === null ? "..." : totalRows}</span>
        </div>
      </div>

      {/* Термінал виводу логів (ЗАХИЩЕНИЙ ВІД ПЕРЕПОВНЕННЯ ТА ВИЛАЗІННЯ) */}
      <div className="bg-gray-950/60 rounded-lg border border-white/5 p-3 h-[250px] max-h-[350px] overflow-y-auto overflow-x-hidden font-mono text-xs text-gray-300 space-y-1.5 scrollbar-thin scrollbar-thumb-white/10">
        {logs.map((log, index) => (
          <p
            key={`${index}-${log.text}`}
            className={`whitespace-pre-wrap break-all leading-relaxed ${log.type === "cmd" ? "text-blue-400 font-bold border-l-2 border-blue-500 pl-1.5" : "text-gray-300"
              }`}
          >
            {log.type === "cmd" ? `> ${log.text}` : log.text}
          </p>
        ))}
        <div ref={logsEndRef} />
      </div>

      {/* Форма введення команд */}
      <form onSubmit={handleCommand} className="flex gap-2 items-center border-t border-white/5 pt-2">
        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder={executing ? "Виконання запиту..." : "db.order.findMany(), db.stats() або 'db.help()'..."}
          value={terminalCmd}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTerminalCmd(event.target.value)}
          disabled={executing}
          className="w-full text-sm font-mono focus:outline-none bg-transparent text-white placeholder-gray-600 disabled:opacity-50"
        />
      </form>
    </div>
  );
}

