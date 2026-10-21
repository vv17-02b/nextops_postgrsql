import React, { useState } from 'react';
import type { CreateOrderInput } from '@/types/api';

interface FormProps {
  onSubmit: (data: CreateOrderInput) => Promise<void>;
}

export default function OrderForm({ onSubmit }: FormProps): React.JSX.Element {
  const [userId, setUserId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({
      userId: userId,
      status: status,
      totalAmount: Number(totalAmount)
    });
    setUserId('');
    setStatus('');
    setTotalAmount('');
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 border rounded-xl bg-gray-50/50 space-y-4 font-sans">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Форма додавання (Order)</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">User ID (MongoDB ObjectId)</label>
        <input 
          type="text" 
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Введіть user id (mongodb objectid)..." 
          className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Статус (PENDING/PAID)</label>
        <input 
          type="text" 
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          placeholder="Введіть статус (pending/paid)..." 
          className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Загальна сума</label>
        <input 
          type="number" 
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
          placeholder="Введіть загальна сума..." 
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
