"use client";

import React from 'react';
import { useUserAiBudget } from '@/hooks/useUseraibudget';
import UserAiBudgetForm from '@/components/useraibudget/useraibudget-form';
import BudgetChart from '@/components/useraibudget/budget-chart'; // 🌟 Підключаємо наш графік
import { Trash2, DollarSign, Activity } from 'lucide-react';

export default function UserAiBudgetPage(): React.JSX.Element {
  const { data, loading, createItem, deleteItem } = useUserAiBudget();

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white p-6 border rounded-xl shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Next.js Сторінка: UserAiBudget</h1>
        <p className="text-sm text-gray-500">Автоматичний зв&apos;язок з роутом бекенду: <code className="text-blue-600 font-mono">/api/useraibudget</code></p>
      </div>

      {/* 🌟 ГНУЧКА СІТКА: Форма та Неоновий графік стають поруч! */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserAiBudgetForm onSubmit={createItem} />
        <BudgetChart />
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Записи з бази PostgreSQL
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Виконується запит до сервера...</div>
        ) : data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase border-b">
                {/* 🌟 ФІКС КОЛОНОК: Оновлено під реальну схему */}
                <tr>
                  <th className="px-4 py-3 text-left">ID Документа</th>
                  <th className="px-4 py-3 text-left">User ID</th>
                  <th className="px-4 py-3 text-left">Загальний Бюджет</th>
                  <th className="px-4 py-3 text-left">Використано</th>
                  <th className="px-4 py-3 text-left">Валюта</th>
                  <th className="px-4 py-3 text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition text-[13px]">
                    <td className="px-4 py-3 font-mono text-xs text-blue-600">{item.id}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{String(item.userId || '-')}</td>
                    
                    <td className="px-4 py-3 text-gray-900 font-bold">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                        <span>{(Number(item.totalBudgetMinor || 0) / 100).toFixed(2)}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-amber-600 font-mono">
                      <div className="flex items-center gap-1">
                        <Activity className="h-3.5 w-3.5 text-amber-400" />
                        <span>{(Number(item.usedBudgetMinor || 0) / 100).toFixed(2)}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 border text-gray-600 text-[10px] font-bold rounded-md font-mono">{String(item.currency || 'USD')}</span></td>
                    
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => deleteItem(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-md transition inline-flex"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400 text-sm">
            Колекція порожня. Заповніть форму вище, щоб додати перший документ.
          </div>
        )}
      </div>
    </div>
  );
}
