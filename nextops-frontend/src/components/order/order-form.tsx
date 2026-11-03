import React, { useState } from 'react';
import type { CreateOrderInput } from '@/types/api';

interface FormProps {
  onSubmit: (data: CreateOrderInput) => Promise<void>;
}

export default function OrderForm({ onSubmit }: FormProps): React.JSX.Element {
  const [productId, setProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        items: [{ productId: productId.trim(), quantity: Number(quantity) }],
        currency: 'UAH',
      });
      setProductId('');
      setQuantity('1');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 border rounded-xl bg-gray-50/50 space-y-4 font-sans">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Форма додавання (Order)</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Product ID (PostgreSQL UUID)</label>
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
        <label className="text-xs font-medium text-gray-600">Кількість</label>
        <input
          type="number"
          min="1"
          step="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
          required
        />
      </div>
      </div>
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
