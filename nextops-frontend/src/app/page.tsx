import React from 'react';
import { LayoutDashboard, Database, ArrowRight } from 'lucide-react';

export default function DashboardPage(): React.JSX.Element {
  return (
    <div className="space-y-6 font-sans max-w-6xl mx-auto w-full">
      <div className="bg-white p-6 md:p-8 border rounded-xl shadow-sm space-y-3">
        <div className="inline-flex p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
          <LayoutDashboard className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">NextOps Studio Control Panel</h1>
          <p className="text-gray-500 text-sm">
            Ласкаво просимо до вашої автоматизованої системи керування базою даних{' '}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-blue-600 font-mono text-xs">nextops_db</code>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 border rounded-xl shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wider">
              <Database className="h-4 w-4 text-emerald-500" />
              Статус системи
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Усі 15 модулів успішно синхронізовано з NestJS бекендом за адресою{' '}
              <code className="bg-gray-50 px-1 py-0.5 rounded text-gray-600 font-mono text-[11px]">
                127.0.0.1:3001
                </code>.
            </p>
          </div>
          <div className="text-xs text-emerald-600 font-medium inline-flex items-center
           gap-1.5 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full w-max">
            ● Сервер працює стабільно
          </div>
        </div>

        <div className="bg-white p-6 border rounded-xl shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Швидкий старт</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Оберіть будь-яку колекцію MongoDB з лівого боку в меню **Sidebar**, 
              щоб почати роботу з документами, відправляти POST-форми або видаляти записи.
            </p>
          </div>
          <span className="text-xs text-blue-600 font-medium inline-flex items-center gap-1">
            Оберіть модуль зліва <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </div>
  );
}
