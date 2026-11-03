import { useState, useEffect, useCallback } from 'react';
import { apiFetch, getApiHeaders, getApiUrl } from '@/lib/api';
import { readPaginatedCollection } from '@/lib/collections';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  priceMinor: number;
}

export type CreateOrderItemInput = Omit<OrderItem, 'id' | 'priceMinor'>;

interface UseOrderItemReturn {
  data: OrderItem[];
  loading: boolean;
  refetch: () => Promise<void>;
  createItem: (formData: CreateOrderItemInput) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export function useOrderItem(): UseOrderItemReturn {
  const [data, setData] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await apiFetch(getApiUrl('/api/orderitem'), {
        headers: getApiHeaders(),
      });
      if (res.ok) {
        const { data } = await readPaginatedCollection<OrderItem>(res);
        setData(data);
      }
    } catch (err: unknown) {
      console.error('Помилка завантаження:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = async (formData: CreateOrderItemInput): Promise<void> => {
    const res = await apiFetch(getApiUrl('/api/orderitem'), {
      method: 'POST',
      headers: getApiHeaders(true),
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      // Якщо сервер відповів 400 або 500, парсимо помилку і викидаємо її для форми
      const errorData = (await res.json().catch(() => ({}))) as { message?: string | string[] };
      const errorMessage = Array.isArray(errorData.message) 
        ? errorData.message.join(', ') 
        : errorData.message || `Помилка сервера: ${res.status}`;
      throw new Error(errorMessage);
    }

    await fetchData();
  };

  const deleteItem = async (id: string): Promise<void> => {
    const res = await apiFetch(getApiUrl(`/api/orderitem/${id}`), {
      method: 'DELETE',
      headers: getApiHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Не вдалося видалити елемент. Статус: ${res.status}`);
    }

    await fetchData();
  };

  useEffect(() => { 
    void fetchData(); 
  }, [fetchData]);

  return { data, loading, refetch: fetchData, createItem, deleteItem };
}
