"use client";

import React, { useEffect, useRef } from 'react';
import { useApiHistory } from '@/hooks/useApihistory';
import ApiHistoryForm from '@/components/apihistory/apihistory-form';

function getPageNumbers(currentPage: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  let firstVisiblePage = Math.max(2, currentPage - 1);
  let lastVisiblePage = Math.min(totalPages - 1, currentPage + 1);

  if (currentPage <= 4) {
    firstVisiblePage = 2;
  } else if (currentPage >= totalPages - 3) {
    firstVisiblePage = totalPages - 3;
    lastVisiblePage = totalPages - 1;
  }

  const pageNumbers: Array<number | 'ellipsis'> = Array.of(1);
  if (firstVisiblePage > 2) pageNumbers.push('ellipsis');
  for (let pageNumber = firstVisiblePage; pageNumber <= lastVisiblePage; pageNumber += 1) {
    pageNumbers.push(pageNumber);
  }
  if (lastVisiblePage < totalPages - 1) pageNumbers.push('ellipsis');
  pageNumbers.push(totalPages);
  return pageNumbers;
}

export default function ApiHistoryPage(): React.JSX.Element {
  const {
    data,
    loading,
    error,
    page,
    limit,
    meta,
    setPage,
    setLimit,
    createItem,
  } = useApiHistory();

  // Використовуємо реф, щоб встановити дефолтний ліміт 5 записів суворо один раз при старті
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      setLimit(5);
    }
  }, [setLimit]);

  const total = meta?.total ?? data.length;
  const totalPages = Math.max(meta?.totalPages ?? 1, 1);
  const firstRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const lastRecord = Math.min(page * limit, total);
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div className="space-y-6 font-sans">
      {/* Шапка */}
      <div className="bg-gray-950/40 backdrop-blur-md p-6 border border-white/10 rounded-xl shadow-2xl">
        <h1 className="text-xl font-bold text-white font-mono">Next.js Сторінка: ApiHistory</h1>
        <p className="text-sm text-gray-400 font-mono">
          Автоматичний зв&apos;язок з роутом бекенду: <code className="text-blue-400 font-mono">/api/apihistory</code>
        </p>
      </div>

      <ApiHistoryForm onSubmit={createItem} />

      {/* Головний контейнер таблиці */}
      <div className="bg-gray-950/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl">
        <div className="border-b border-white/10 bg-gray-900/30 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 font-mono">
            Записи з бази PostgreSQL
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm font-mono">Виконується запит до сервера...</div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-red-400 font-mono" role="alert">● {error}</div>
        ) : data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gray-900/50 text-xs font-semibold text-gray-400 uppercase border-b border-white/10 font-mono">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left">ID Документа</th>
                  <th scope="col" className="px-4 py-3 text-left">Ендпоінт (/api/...)</th>
                  <th scope="col" className="px-4 py-3 text-left">Метод (GET/POST)</th>
                  <th scope="col" className="px-4 py-3 text-left">Статус код (200/400)</th>
                  <th scope="col" className="px-4 py-3 text-left">Тривалість (мс)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-gray-200">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition text-[13px]">
                    <td className="max-w-40 break-all px-4 py-3 text-xs text-blue-400">{item.id}</td>
                    <td className="max-w-64 break-words px-4 py-3">{String(item.endpoint || '-')}</td>
                    <td className="whitespace-nowrap px-4 py-3">{String(item.method || '-')}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={item.statusCode >= 400 ? 'text-red-400' : 'text-emerald-400'}>
                        {String(item.statusCode || '-')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-300">{String(item.durationMs || '-')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400 text-sm font-mono">
            На цій сторінці записів немає.
          </div>
        )}

        {/* Навігація / Пагінація */}
        {!error && (
          <nav
            aria-label="Пагінація журналу API"
            className="flex flex-col gap-4 border-t border-white/10 bg-gray-950/20 p-4 sm:flex-row sm:items-center sm:justify-between font-mono"
          >
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium text-gray-400">Кількість записів на сторінці</p>
              <div className="flex items-center gap-2">
                {Array.of(5, 10, 15).map((pageSize) => (
                  <button
                    key={pageSize}
                    type="button"
                    onClick={() => {
                      setPage(1); // При зміні ліміту безпечно скидаємо на 1 сторінку
                      setLimit(pageSize);
                    }}
                    aria-pressed={limit === pageSize}
                    className={`min-h-8 min-w-10 rounded-md border text-xs font-medium transition cursor-pointer ${
                      limit === pageSize
                        ? 'border-blue-500 bg-blue-600/30 text-blue-400 shadow-md'
                        : 'border-white/10 bg-gray-900/50 text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {pageSize}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:items-end">
              <p className="text-xs text-gray-400" aria-live="polite">
                {total > 0 ? `Показано ${firstRecord}–${lastRecord} із ${total}` : 'Записів немає'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="min-h-8 rounded-md border border-white/10 bg-gray-900/50 px-2.5 text-xs text-gray-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
                >
                  Попередня
                </button>
                
                {pageNumbers.map((pageNumber, index) => (
                  pageNumber === 'ellipsis' ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="flex min-h-8 min-w-7 items-center justify-center text-xs text-gray-600"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setPage(pageNumber)}
                      className={`min-h-8 min-w-8 rounded-md border text-xs font-medium transition cursor-pointer ${
                        pageNumber === page
                          ? 'border-blue-500 bg-blue-600/30 text-blue-400 shadow-md'
                          : 'border-white/10 bg-gray-900/50 text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  )
                ))}

                <button
                  type="button"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages || total === 0}
                  className="min-h-8 rounded-md border border-white/10 bg-gray-900/50 px-2.5 text-xs text-gray-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
                >
                  Наступна
                </button>
              </div>
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
