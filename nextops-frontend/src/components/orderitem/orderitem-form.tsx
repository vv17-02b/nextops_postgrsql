"use client";

import React, { useState } from 'react';
import { useOrderItem, CreateOrderItemInput } from '../../hooks/useOrderItemCore';

export function OrderItemForm(): React.JSX.Element {
  const { createItem } = useOrderItem();
  const [orderId, setOrderId] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!orderId || !productId || !quantity) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const payload: CreateOrderItemInput = {
        orderId: orderId.trim(),
        productId: productId.trim(),
        quantity: Number(quantity),
      };

      await createItem(payload);
      
      setOrderId('');
      setProductId('');
      setQuantity('');
    } catch (err: unknown) {
      // Виводимо помилку валідації NestJS прямо на форму
      setError(err instanceof Error ? err.message : 'Невідома помилка відправки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 border rounded-xl bg-gray-50/50 space-y-4 font-sans">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
        Форма додавання (OrderItem)
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">ID Замовлення (orderId)</label>
          <input 
            type="text" 
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Введіть ID замовлення..." 
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>
        
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">ID Продукту (productId)</label>
          <input 
            type="text" 
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            placeholder="Введіть ID продукту..." 
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Кількість (quantity)</label>
          <input 
            type="number" 
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Введіть кількість..." 
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>

      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-mono text-red-600">
          ⚠️ {error}
        </div>
      )}

      <button 
        type="submit" 
        disabled={loading}
        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50 shadow-sm"
      >
        {loading ? 'Надсилання...' : 'Створити документ'}
      </button>
    </form>
  );
}
