'use client';

import React from 'react';
import { X } from 'lucide-react';
import type { PaginationMeta } from '@/lib/collections';

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

interface ApiErrorBannerProps {
  error: string | null;
  onDismiss?: () => void;
}

export function ApiErrorBanner({ error, onDismiss }: ApiErrorBannerProps): React.JSX.Element | null {
  if (!error) return null;

  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-3 rounded-xl border border-red-500/30 bg-red-950/40 backdrop-blur-md px-4 py-3 text-sm text-red-300 shadow-2xl font-mono"
    >
      <span className="break-words">● {error}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Закрити сповіщення"
          className="rounded-md p-1 text-red-400 transition hover:bg-white/10 hover:text-white cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

interface PaginationControlsProps {
  meta: PaginationMeta | null;
  dataLength: number;
  page: number;
  limit: number;
  loading?: boolean;
  ariaLabel?: string;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function PaginationControls({
  meta,
  dataLength,
  page,
  limit,
  loading = false,
  ariaLabel = 'Пагінація списку',
  onPageChange,
  onLimitChange,
}: PaginationControlsProps): React.JSX.Element {
  const total = meta?.total ?? dataLength;
  const totalPages = Math.max(meta?.totalPages ?? 1, 1);
  const firstRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const lastRecord = Math.min(page * limit, total);
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <nav
      aria-label={ariaLabel}
      className="flex flex-col gap-4 border-t border-white/10 bg-gray-950/20 p-4 sm:flex-row sm:items-center sm:justify-between font-mono"
    >
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-gray-400">Кількість записів на сторінці</p>
        <div className="flex flex-wrap items-center gap-2">
          {Array.of(5, 10, 15, 20).map((pageSize) => (
            <button
              key={pageSize}
              type="button"
              disabled={loading}
              onClick={() => onLimitChange(pageSize)}
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
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || loading}
            className="min-h-8 rounded-md border border-white/10 bg-gray-900/50 px-2.5 text-xs text-gray-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
          >
            Попередня
          </button>

          {pageNumbers.map((pageNumber, index) =>
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
                disabled={loading}
                onClick={() => onPageChange(pageNumber)}
                className={`min-h-8 min-w-8 rounded-md border text-xs font-medium transition cursor-pointer ${
                  pageNumber === page
                    ? 'border-blue-500 bg-blue-600/30 text-blue-400 shadow-md'
                    : 'border-white/10 bg-gray-900/50 text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {pageNumber}
              </button>
            ),
          )}

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || loading}
            className="min-h-8 rounded-md border border-white/10 bg-gray-900/50 px-2.5 text-xs text-gray-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
          >
            Наступна
          </button>
        </div>
      </div>
    </nav>
  );
}
