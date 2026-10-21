import { useState, useEffect, useCallback } from 'react';
import type { CreateSessionInput, Session } from '@/types/api';
export type { CreateSessionInput, Session };

export function useSession() {
  const [data, setData] = useState<Session[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/' + 'session');
      if (res.ok) {
        const json = (await res.json()) as Session[];
        setData(Array.isArray(json) ? json : []);
      }
    } catch (err) {
      console.error('Помилка завантаження:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = async (formData: CreateSessionInput): Promise<void> => {
    try {
      const res = await fetch('http://localhost:3001/api/' + 'session', {
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
      const res = await fetch('http://localhost:3001/api/' + 'session/' + id, { method: 'DELETE' });
      if (res.ok) await fetchData();
    } catch (err) {
      console.error('Помилка видалення:', err);
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, refetch: fetchData, createItem, deleteItem };
}
