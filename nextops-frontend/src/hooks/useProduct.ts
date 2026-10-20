import { useState, useEffect, useCallback } from 'react';

// Строгий інтерфейс моделі без жодного any відповідно до стандарту Zero-Any
export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  isActive: boolean;
  categoryId: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

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

  // Використовуємо відносні шляхи Next.js, щоб запити йшли разом із JWT сесією
  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await fetch('/api/product');
      if (res.ok) {
        const json = (await res.json()) as Product[];
        setData(Array.isArray(json) ? json : []);
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
      const res = await fetch('/api/product', {
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
      const res = await fetch(`/api/product/${id}`, { 
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
