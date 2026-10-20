import { useState, useEffect, useCallback } from 'react';

// Чистий інтерфейс моделі відповідно до вашої схеми бази даних MongoDB Atlas
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
}

// Безпечний тип для створення нових записів без обов'язкового ID
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

  // Використовуємо відносні шляхи Next.js, щоб запити проксувалися автоматично
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
    try {
      const res = await fetch('/api/orderitem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`/api/orderitem/${id}`, { 
        method: 'DELETE',
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
