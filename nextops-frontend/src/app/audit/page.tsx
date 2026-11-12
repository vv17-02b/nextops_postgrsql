"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { apiFetch, getApiHeaders, getApiUrl } from '@/lib/api';
import { ApiErrorBanner } from '@/components/common/collection-controls';
import { ShieldCheck, Clock, User as UserIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface AuditLogRecord {
  id: string;
  companyId: string;
  actorUserId: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AuditLogPage(): React.JSX.Element {
  const [items, setItems] = useState<AuditLogRecord[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(15);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadAuditLogs = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const url = getApiUrl(`/api/audit?page=${page}&limit=${limit}`);
      const res = await apiFetch(url, { headers: getApiHeaders() });
      if (!res.ok) {
        setError(`Не вдалося завантажити журнал аудиту (HTTP ${res.status}). Доступно для OWNER та ADMIN.`);
        return;
      }
      const payload = (await res.json()) as { data?: AuditLogRecord[]; meta?: PaginationMeta };
      setItems(Array.isArray(payload.data) ? payload.data : []);
      if (payload.meta) {
        setMeta(payload.meta);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Помилка мережі при завантаженні журналу аудиту.');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    void loadAuditLogs();
  }, [loadAuditLogs]);

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-gray-950/40 backdrop-blur-md p-6 border border-white/10 rounded-xl shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white font-mono flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              Журнал аудиту безпеки (Audit Log)
            </h1>
            <p className="text-sm text-gray-400 font-mono mt-1">
              Незмінна історія критичних дій у робочому просторі: зміна цін, статусів замовлень та параметрів
            </p>
          </div>
          <span className="rounded-lg border border-blue-500/30 bg-blue-500/15 px-3 py-1.5 text-xs font-semibold text-blue-300 font-mono">
            Захищено PostgreSQL RLS
          </span>
        </div>
      </div>

      <ApiErrorBanner error={error} onDismiss={() => setError(null)} />

      <div className="bg-gray-950/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/10 bg-gray-900/40 flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-300 font-mono">
            Події аудиту ({meta.total})
          </h2>
          <span className="text-xs text-emerald-400 font-mono">● Read-Only Compliance Log</span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm font-mono">
              Завантаження записів аудиту...
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm font-mono">
              Подій аудиту ще немає. Змініть ціну товару або статус замовлення — запис з&apos;явиться автоматично.
            </div>
          ) : (
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 bg-gray-900/30">
                  <th className="p-3">Час</th>
                  <th className="p-3">Подія (Action)</th>
                  <th className="p-3">Сутність</th>
                  <th className="p-3">Ініціатор</th>
                  <th className="p-3">Деталі (Metadata)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-gray-200">
                {items.map((entry) => (
                  <tr key={entry.id} className="hover:bg-white/5 transition">
                    <td className="p-3 text-gray-400 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-gray-500" />
                        {new Date(entry.createdAt).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="rounded bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-amber-300 font-semibold">
                        {entry.action}
                      </span>
                    </td>
                    <td className="p-3 text-blue-300">
                      {entry.entityType} <span className="text-gray-500">({entry.entityId.slice(0, 8)}...)</span>
                    </td>
                    <td className="p-3 text-gray-300">
                      <span className="inline-flex items-center gap-1">
                        <UserIcon className="h-3.5 w-3.5 text-gray-500" />
                        {entry.actorEmail ?? entry.actorUserId ?? 'System / API'}
                      </span>
                    </td>
                    <td className="p-3 text-gray-400 max-w-xs truncate">
                      {entry.metadata ? JSON.stringify(entry.metadata) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-4 border-t border-white/10 bg-gray-900/30 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span>Записів на сторінці:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="rounded border border-white/10 bg-gray-900 px-2 py-1 text-white outline-none"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span>
              Сторінка {meta.page} із {Math.max(1, meta.totalPages)}
            </span>
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2.5 py-1 text-white hover:bg-white/10 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Назад
            </button>
            <button
              type="button"
              disabled={page >= meta.totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2.5 py-1 text-white hover:bg-white/10 disabled:opacity-40 cursor-pointer"
            >
              Вперед <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
