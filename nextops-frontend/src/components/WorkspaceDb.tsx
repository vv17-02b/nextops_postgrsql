"use client";

import React, { useEffect, useState } from "react";
import { BarChart3, Database, ChevronRight } from "lucide-react";
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
  const [logs, setLogs] = useState<string[]>([
    "PostgreSQL terminal initialized through Prisma and the NestJS API.",
    "Type 'db.help()' to view available terminal commands.",
  ]);
  const [terminalCmd, setTerminalCmd] = useState("");
  const [executing, setExecuting] = useState(false);
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [databaseOnline, setDatabaseOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    void fetchEntityRows("project")
      .then((projects) => {
        if (active) {
          setProjectCount(countRows(projects));
          setDatabaseOnline(true);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setDatabaseOnline(false);
          const message = error instanceof Error ? error.message : "Unknown API error.";
          setLogs((previous) => [
            ...previous,
            `[${new Date().toLocaleTimeString()}] Database status check failed: ${message}`,
          ]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleCommand = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!terminalCmd.trim() || executing) return;

    const enteredCommand = terminalCmd.trim();
    const command = enteredCommand.toLowerCase();
    const stamp = new Date().toLocaleTimeString();

    setLogs((previous) => [...previous, `> ${enteredCommand}`]);
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
          if (entity === "project") {
            setProjectCount(countRows(rows));
          }
          setDatabaseOnline(true);
        }
      }

      setLogs((previous) => [...previous, `[${stamp}] ${response}`]);
    } catch (error: unknown) {
      setDatabaseOnline(false);
      const message = error instanceof Error ? error.message : "Unknown API error.";
      setLogs((previous) => [...previous, `[${stamp}] Error: ${message}`]);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="flex flex-col h-full border border-white/10 bg-neutral-900/40 backdrop-blur-xl p-5 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transition-all duration-300">
      <div className="flex justify-between items-center border-b border-neutral-800 pb-3 mb-4 select-none">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-amber-500" />
          <span className="text-sm font-mono text-amber-500 font-black tracking-wider">LIVE_POSTGRESQL_TERMINAL</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-amber-600/70 font-bold flex items-center gap-1">
            <Database className="w-3.5 h-3.5" /> POSTGRESQL
          </span>
          {isOpen && onCloseAction && (
            <button
              type="button"
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                event.stopPropagation();
                onCloseAction();
              }}
              className="text-xs font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded-lg hover:bg-red-500 hover:text-white transition cursor-pointer"
            >
              [ × CLOSE ]
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4" onClick={(event) => event.stopPropagation()}>
        <div className="p-3 bg-black/40 rounded-xl border border-neutral-800 text-center font-mono">
          <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-black">Project rows</p>
          <p className="text-xl font-black text-white mt-1">
            {projectCount === null ? "..." : projectCount}
          </p>
        </div>
        <div className="p-3 bg-black/40 rounded-xl border border-neutral-800 text-center font-mono">
          <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-black">Database status</p>
          <p className={`text-xl font-black mt-1 ${databaseOnline === false ? "text-red-400" : "text-amber-400"}`}>
            {databaseOnline === null ? "CHECKING" : databaseOnline ? "ONLINE" : "OFFLINE"}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-neutral-950/90 rounded-xl border border-neutral-800 p-3 overflow-hidden shadow-inner">
        <div className="flex-1 overflow-y-auto font-mono text-xs text-amber-400/90 space-y-1.5 mb-3 pr-1">
          {logs.map((log, index) => (
            <p key={`${index}-${log}`} className="whitespace-pre-wrap leading-relaxed">{log}</p>
          ))}
        </div>

        <form onSubmit={handleCommand} className="flex gap-2 border-t border-neutral-900 pt-2.5 items-center">
          <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 stroke-[3]" />
          <input
            type="text"
            placeholder="db.order.findMany(), db.stats() або 'db.help()'..."
            value={terminalCmd}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTerminalCmd(event.target.value)}
            disabled={executing}
            className="flex-1 bg-transparent text-white font-mono text-sm focus:outline-none placeholder-neutral-700 disabled:opacity-50"
          />
        </form>
      </div>
    </div>
  );
}
