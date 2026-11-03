import { useState, useEffect, useCallback } from 'react';
import type { Category, CreateCategoryInput } from '@/types/api';
import { apiFetch, getApiHeaders, getApiUrl } from '@/lib/api';
import { readPaginatedCollection } from '@/lib/collections';
export type { Category, CreateCategoryInput };

export function useCategory() {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await apiFetch(getApiUrl('/api/category'), { headers: getApiHeaders() });
      if (res.ok) {
        const { data } = await readPaginatedCollection<Category>(res);
        setData(data);
      }
    } catch (err) {
      console.error('Помилка завантаження:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = async (formData: CreateCategoryInput): Promise<void> => {
    try {
      const res = await apiFetch(getApiUrl('/api/category'), {
        method: 'POST',
        headers: getApiHeaders(true),
        body: JSON.stringify(formData)
      });
      if (res.ok) await fetchData();
    } catch (err) {
      console.error('Помилка створення:', err);
    }
  };

  const deleteItem = async (id: string): Promise<void> => {
    try {
      const res = await apiFetch(getApiUrl(`/api/category/${id}`), {
        method: 'DELETE',
        headers: getApiHeaders(),
      });
      if (res.ok) await fetchData();
    } catch (err) {
      console.error('Помилка видалення:', err);
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, refetch: fetchData, createItem, deleteItem };
}
