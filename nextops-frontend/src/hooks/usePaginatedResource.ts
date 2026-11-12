'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch, getApiHeaders, getApiUrl } from '@/lib/api';
import { readPaginatedCollection, type PaginationMeta } from '@/lib/collections';

export interface UsePaginatedResourceReturn<TItem, TCreate = Partial<TItem>> {
  data: TItem[];
  loading: boolean;
  error: string | null;
  page: number;
  limit: number;
  meta: PaginationMeta | null;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  clearError: () => void;
  refetch: () => Promise<void>;
  createItem: (formData: TCreate) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

async function extractApiErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const payload: unknown = await res.json();
    if (typeof payload === 'object' && payload !== null && 'message' in payload) {
      const msg = (payload as { message?: unknown }).message;
      if (typeof msg === 'string' && msg.trim().length > 0) {
        return msg;
      }
      if (Array.isArray(msg) && msg.length > 0) {
        return msg.map(String).join(', ');
      }
    }
  } catch {
    // Ignore JSON parse errors on non-JSON responses.
  }

  if (res.status === 401) return 'Сесія завершена. Будь ласка, увійдіть у систему повторно.';
  if (res.status === 403) return 'Недостатньо прав доступу для виконання цієї дії.';
  return `${fallback} (HTTP ${res.status})`;
}

export function usePaginatedResource<TItem, TCreate = Partial<TItem>>(
  endpoint: string,
  initialLimit = 20,
): UsePaginatedResourceReturn<TItem, TCreate> {
  const [data, setData] = useState<TItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(initialLimit);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      const res = await apiFetch(getApiUrl(`${endpoint}?${params.toString()}`), {
        headers: getApiHeaders(),
      });
      if (res.ok) {
        const collection = await readPaginatedCollection<TItem>(res);
        setData(collection.data);
        setMeta(collection.meta);
        if (collection.meta) {
          const lastPage = Math.max(1, collection.meta.totalPages);
          if (page > lastPage) {
            setPage(lastPage);
          }
        }
      } else {
        const message = await extractApiErrorMessage(res, 'Не вдалося завантажити дані');
        setError(message);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Помилка мережі при завантаженні даних.');
    } finally {
      setLoading(false);
    }
  }, [endpoint, limit, page]);

  const createItem = async (formData: TCreate): Promise<void> => {
    setError(null);
    try {
      const res = await apiFetch(getApiUrl(endpoint), {
        method: 'POST',
        headers: getApiHeaders(true),
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        if (page === 1) {
          await fetchData();
        } else {
          setPage(1);
        }
      } else {
        const message = await extractApiErrorMessage(res, 'Не вдалося створити запис');
        setError(message);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Помилка мережі при створенні запису.');
    }
  };

  const deleteItem = async (id: string): Promise<void> => {
    setError(null);
    try {
      const res = await apiFetch(getApiUrl(`${endpoint}/${id}`), {
        method: 'DELETE',
        headers: getApiHeaders(),
      });
      if (res.ok) {
        await fetchData();
      } else {
        const message = await extractApiErrorMessage(res, 'Не вдалося видалити запис');
        setError(message);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Помилка мережі при видаленні запису.');
    }
  };

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const changeLimit = (nextLimit: number): void => {
    setLimit(nextLimit);
    setPage(1);
  };

  return {
    data,
    loading,
    error,
    page,
    limit,
    meta,
    setPage,
    setLimit: changeLimit,
    clearError: () => setError(null),
    refetch: fetchData,
    createItem,
    deleteItem,
  };
}
