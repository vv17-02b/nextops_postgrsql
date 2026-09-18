"use client";

import React from 'react';
import { useCategory } from '@/hooks/useCategory';
import CategoryForm from '@/components/category/category-form';
import { Trash2 } from 'lucide-react';

export default function CategoryPage(): React.JSX.Element {
  const { data, loading, createItem, deleteItem } = useCategory();

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white p-6 border rounded-xl shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Next.js Сторінка: Category</h1>
        <p className="text-sm text-gray-500">Автоматичний зв'язок з роутом бекенду: <code className="text-blue-600 font-mono">/api/category</code></p>
      </div>

      <CategoryForm onSubmit={createItem} />

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Список документів з бази даних (MongoDB Atlas)
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Виконується запит до сервера...</div>
        ) : data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase border-b">
                <tr>
                  <th className="px-4 py-3 text-left">ID Документа</th>
                  <th className="px-4 py-3 text-left">Назва категорії</th>
            <th className="px-4 py-3 text-left">Слаг (URL)</th>
            <th className="px-4 py-3 text-left">Опис</th>
                  <th className="px-4 py-3 text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition text-[13px]">
                    <td className="px-4 py-3 font-mono text-xs text-blue-600"> {item.id} </td>
                    <td className="px-4 py-3 text-gray-700"> {String(item.name || '-')} </td>
                <td className="px-4 py-3 text-gray-700"> {String(item.slug || '-')} </td>
                <td className="px-4 py-3 text-gray-700"> {String(item.description || '-')} </td>
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
