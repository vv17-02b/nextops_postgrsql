import { useState, useEffect, useCallback } from 'react';
import type { ApiHistory, CreateApiHistoryInput } from '@/types/api';
export type { ApiHistory, CreateApiHistoryInput };

export function useApiHistory() {
  const [data, setData] = useState<ApiHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/' + 'apihistory');
      if (res.ok) {
        const json = (await res.json()) as ApiHistory[];
        setData(Array.isArray(json) ? json : []);
      }
    } catch (err) {
      console.error('Помилка завантаження:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = async (formData: CreateApiHistoryInput): Promise<void> => {
    try {
      const res = await fetch('http://localhost:3001/api/' + 'apihistory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) await fetchData();
    } catch (err) {
      console.error('Помилка створення:', err);
    }
  };

  const deleteItem = async (id: string): Promise<void> => {
    try {
      const res = await fetch('http://localhost:3001/api/' + 'apihistory/' + id, { method: 'DELETE' });
      if (res.ok) await fetchData();
    } catch (err) {
      console.error('Помилка видалення:', err);
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, refetch: fetchData, createItem, deleteItem };
}
