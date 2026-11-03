"use client";

import React, { useState } from 'react';
import type { CreateUserAiBudgetInput } from '@/types/api';

interface FormProps {
  onSubmit: (data: CreateUserAiBudgetInput) => Promise<void>;
}

export default function UserAiBudgetForm({ onSubmit }: FormProps): React.JSX.Element {
  const [userId, setUserId] = useState<string>('');
  const [totalBudgetMinor, setTotalBudgetMinor] = useState<string>('');
  const [currency, setCurrency] = useState<string>('USD'); // За дефолтом ставимо USD
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    // Копійки/центи: надсилаємо цілі minor units, які очікує CreateUserAiBudgetDto
    await onSubmit({
      userId: userId,
      totalBudgetMinor: Math.round(Number(totalBudgetMinor)),
      usedBudgetMinor: 0, // Новий бюджет завжди стартує з нуля
      currency: currency
    });

    setUserId('');
    setTotalBudgetMinor('');
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 border rounded-xl bg-gray-50/50 space-y-4 font-sans">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Форма додавання (UserAiBudget)</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Поле для введення UUID користувача */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">User ID (PostgreSQL)</label>
          <input 
            type="text" 
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Введіть 24-значний ID..." 
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        {/* Загальний бюджет у minor units (копійках) */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Загальний Бюджет (Minor Units)</label>
          <input 
            type="number" 
            step="1"
            min="0"
            value={totalBudgetMinor}
            onChange={(e) => setTotalBudgetMinor(e.target.value)}
            placeholder="Ліміт у копійках (напр. 50000 = $500)..."  
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        {/* Селект вибору валюти лімітів */}
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium text-gray-600">Валюта ліміту (Currency)</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
          >
            <option value="USD">USD ($) — Американський долар</option>
            <option value="EUR">EUR (€) — Євро</option>
            <option value="UAH">UAH (₴) — Українська гривня</option>
          </select>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50 shadow-sm"
      >
        {loading ? 'Надсилання...' : 'Створити ліміт'}
      </button>
    </form>
  );
}
