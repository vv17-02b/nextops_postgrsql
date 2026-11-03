import { useState, useEffect, useCallback } from 'react';
import type { ApiHistory, CreateApiHistoryInput } from '@/types/api';
import { apiFetch, getApiHeaders, getApiUrl } from '@/lib/api';
import { readPaginatedCollection, type PaginationMeta } from '@/lib/collections';
export type { ApiHistory, CreateApiHistoryInput };

export function useApiHistory() {
  const [data, setData] = useState<ApiHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      const res = await apiFetch(getApiUrl(`/api/apihistory?${params.toString()}`), {
        headers: getApiHeaders(),
      });
      if (res.ok) {
        const collection = await readPaginatedCollection<ApiHistory>(res);
        setData(collection.data);
        setMeta(collection.meta);
        if (collection.meta) {
          const lastPage = Math.max(1, collection.meta.totalPages);
          if (page > lastPage) setPage(lastPage);
        }
      } else {
        setError(`Не вдалося завантажити журнал API (HTTP ${res.status}).`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити журнал API.');
    } finally {
      setLoading(false);
    }
  }, [limit, page]);

  const createItem = async (formData: CreateApiHistoryInput): Promise<boolean> => {
    const res = await apiFetch(getApiUrl('/api/apihistory'), {
      method: 'POST',
      headers: getApiHeaders(true),
      body: JSON.stringify(formData)
    });
    if (!res.ok) {
      const payload: unknown = await res.json();
      const message = typeof payload === 'object' && payload !== null && 'message' in payload
        && typeof payload.message === 'string'
        ? payload.message
        : `Не вдалося створити запис (HTTP ${res.status}).`;
      throw new Error(message);
    }
    if (page === 1) await fetchData();
    else setPage(1);
    return true;
  };

  useEffect(() => { fetchData(); }, [fetchData]);

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
    refetch: fetchData,
    createItem,
  };
}
