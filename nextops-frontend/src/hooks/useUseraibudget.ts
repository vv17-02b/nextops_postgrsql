import { useState, useEffect, useCallback } from 'react';
import type { CreateUserAiBudgetInput, UserAiBudget } from '@/types/api';
import { readPaginatedCollection } from '@/lib/collections';
import { apiFetch, getApiHeaders, getApiUrl } from '@/lib/api';
export type { CreateUserAiBudgetInput, UserAiBudget };

export function useUserAiBudget() {
  const [data, setData] = useState<UserAiBudget[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await apiFetch(getApiUrl('/api/useraibudget'), { headers: getApiHeaders() });
      if (res.ok) {
        const { data } = await readPaginatedCollection<UserAiBudget>(res);
        setData(data);
      }
    } catch (err) {
      console.error('Помилка завантаження:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = async (formData: CreateUserAiBudgetInput): Promise<void> => {
    try {
      const res = await apiFetch(getApiUrl('/api/useraibudget'), {
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
      const res = await apiFetch(getApiUrl(`/api/useraibudget/${id}`), {
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
