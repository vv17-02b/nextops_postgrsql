import { useState, useEffect, useCallback } from 'react';

export interface OrderItem {
  id: string;
  [key: string]: any;
}

export function useOrderItem() {
  const [data, setData] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/' + 'orderitem');
      if (res.ok) {
        const json = await res.json();
        setData(Array.isArray(json) ? json : []);
      }
    } catch (err) {
      console.error('Помилка завантаження:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = async (formData: any): Promise<void> => {
    try {
      const res = await fetch('http://localhost:3001/api/' + 'orderitem', {
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
      const res = await fetch('http://localhost:3001/api/' + 'orderitem/' + id, { method: 'DELETE' });
      if (res.ok) await fetchData();
    } catch (err) {
      console.error('Помилка видалення:', err);
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, refetch: fetchData, createItem, deleteItem };
}
