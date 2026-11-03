import { useState, useEffect, useCallback } from 'react';
import type { CreateProductInput, Product } from '@/types/api';
import { apiFetch, getApiHeaders, getApiUrl } from '@/lib/api';
import { readPaginatedCollection } from '@/lib/collections';
export type { CreateProductInput, Product };

interface UseProductReturn {
  data: Product[];
  loading: boolean;
  refetch: () => Promise<void>;
  createItem: (formData: CreateProductInput) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export function useProduct(): UseProductReturn {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await apiFetch(getApiUrl('/api/product'), {
        headers: getApiHeaders(),
      });
      if (res.ok) {
        const { data } = await readPaginatedCollection<Product>(res);
        setData(data);
      } else {
        console.error('Сервер повернув помилку доступу. Статус:', res.status);
      }
    } catch (err: unknown) {
      console.error('Помилка завантаження:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = async (formData: CreateProductInput): Promise<void> => {
    try {
      const res = await apiFetch(getApiUrl('/api/product'), {
        method: 'POST',
        headers: getApiHeaders(true),
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err: unknown) {
      console.error('Помилка створення:', err);
    }
  };

  const deleteItem = async (id: string): Promise<void> => {
    try {
      const res = await apiFetch(getApiUrl(`/api/product/${id}`), {
        method: 'DELETE',
        headers: getApiHeaders(),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err: unknown) {
      console.error('Помилка видалення:', err);
    }
  };

  useEffect(() => { 
    void fetchData(); 
  }, [fetchData]);

  return { data, loading, refetch: fetchData, createItem, deleteItem };
}
