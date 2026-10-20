import { useState, useEffect, useCallback } from 'react';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
}

export type CreateOrderItemInput = Omit<OrderItem, 'id'>;

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
      const res = await fetch('/api/orderitem');
      if (res.ok) {
        const json = (await res.json()) as OrderItem[];
        setData(Array.isArray(json) ? json : []);
      }
    } catch (err: unknown) {
      console.error('Помилка завантаження:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = async (formData: CreateOrderItemInput): Promise<void> => {
    const res = await fetch('/api/orderitem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch(`/api/orderitem/${id}`, { 
      method: 'DELETE',
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
