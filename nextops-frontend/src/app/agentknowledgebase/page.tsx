"use client";

import React from 'react';
import { useAgentKnowledgeBase } from '@/hooks/useAgentknowledgebase';
import AgentKnowledgeBaseForm from '@/components/agentknowledgebase/agentknowledgebase-form';
import { Trash2 } from 'lucide-react';

export default function AgentKnowledgeBasePage(): React.JSX.Element {
  const { data, loading, createItem, deleteItem } = useAgentKnowledgeBase();

  return (
    <div className="space-y-6 font-sans">
      {/* Шапка */}
      <div className="bg-gray-950/40 backdrop-blur-md p-6 border border-white/10 rounded-xl shadow-2xl">
        <h1 className="text-xl font-bold text-white font-mono">Next.js Сторінка: AgentKnowledgeBase</h1>
        <p className="text-sm text-gray-400 font-mono">Автоматичний зв&apos;язок з роутом бекенду: <code className="text-blue-400 font-mono">/api/agentknowledgebase</code></p>
      </div>

      <AgentKnowledgeBaseForm onSubmit={createItem} />

      {/* Головний контейнер таблиці */}
      <div className="bg-gray-950/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl">
        <div className="border-b border-white/10 bg-gray-900/30 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 font-mono">
            Записи з бази PostgreSQL
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm font-mono">Виконується запит до сервера...</div>
        ) : data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gray-900/50 text-xs font-semibold text-gray-400 uppercase border-b border-white/10 font-mono">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left">ID Документа</th>
                  <th scope="col" className="px-4 py-3 text-left">Project ID (PostgreSQL UUID)</th>
                  <th scope="col" className="px-4 py-3 text-left">Заголовок бази знань</th>
                  <th scope="col" className="px-4 py-3 text-left">Вміст (Контент)</th>
                  <th scope="col" className="px-4 py-3 text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-gray-200">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition text-[13px]">
                    <td className="px-4 py-3 font-mono text-xs text-blue-400"> {item.id} </td>
                    <td className="px-4 py-3 text-gray-300"> {String(item.projectId || '-')} </td>
                    <td className="px-4 py-3 text-gray-300"> {String(item.title || '-')} </td>
                    <td className="px-4 py-3 break-words text-gray-300"> {String(item.content || '-')} </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteItem(item.id)}
                        aria-label="Видалити запис"
                        className="p-1.5 text-gray-400 hover:text-red-400 rounded-md transition inline-flex cursor-pointer"
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
          <div className="p-8 text-center text-gray-400 text-sm font-mono">
            Колекція порожня. Заповніть форму вище, щоб додати перший документ.
          </div>
        )}
      </div>
    </div>
  );
}
