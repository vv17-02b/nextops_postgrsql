import { useState, useEffect, useCallback } from 'react';
import type { CreateReviewInput, Review } from '@/types/api';
import { apiFetch, getApiHeaders, getApiUrl } from '@/lib/api';
import { readPaginatedCollection } from '@/lib/collections';
export type { CreateReviewInput, Review };

export function useReview() {
  const [data, setData] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await apiFetch(getApiUrl('/api/review'), { headers: getApiHeaders() });
      if (res.ok) {
        const { data } = await readPaginatedCollection<Review>(res);
        setData(data);
      }
    } catch (err) {
      console.error('Помилка завантаження:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = async (formData: CreateReviewInput): Promise<void> => {
    try {
      const res = await apiFetch(getApiUrl('/api/review'), {
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
      const res = await apiFetch(getApiUrl(`/api/review/${id}`), {
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
