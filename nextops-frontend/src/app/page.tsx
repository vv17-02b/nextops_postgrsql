import React from 'react';
import { LayoutDashboard, Database, ArrowRight } from 'lucide-react';

export default function DashboardPage(): React.JSX.Element {
  return (
    <div className="bg-custom-way p-6 md:p-8 space-y-6 font-sans max-w-6xl mx-auto w-full min-h-[calc(100vh-2rem)] shadow-[0_0_50px_rgba(0,0,0,0.6)]">
      
      {/* Головна картка: Скло без рамок */}
      <div className="relative overflow-hidden bg-gray-900/40 backdrop-blur-md p-6 md:p-8 rounded-xl shadow-2xl space-y-3">
        <div className="inline-flex p-3 bg-blue-500/10 text-blue-400 rounded-xl">
          <LayoutDashboard className="h-6 w-6 animate-pulse" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            NextOps Studio Control Panel
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Ласкаво просимо до вашої автоматизованої системи керування базу даних{' '}
            <code className="bg-gray-950/80 px-2 py-0.5 rounded text-blue-400 font-mono text-xs">
              nextops_db
            </code>.
          </p>
        </div>
      </div>

      {/* Сітка статусів без рамок */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Картка: Статус системи */}
        <div className="bg-gray-900/30 backdrop-blur-md p-6 rounded-xl shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-400 uppercase tracking-wider font-mono">
              <Database className="h-4 w-4 text-emerald-400" />
              Статус системи
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Усі 15 модулів успішно синхронізовано з NestJS бекендом за адресою{' '}
              <code className="bg-gray-950/80 px-2 py-0.5 rounded text-gray-300 font-mono text-[11px]">
                127.0.0.1:3001
              </code>.
            </p>
          </div>
          <div className="text-xs text-emerald-400 font-medium inline-flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full w-max font-mono animate-pulse">
            ● Сервер працює стабільно
          </div>
        </div>

        {/* Картка: Швидкий старт */}
        <div className="bg-gray-900/30 backdrop-blur-md p-6 rounded-xl shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider font-mono">Швидкий старт</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Оберіть будь-яку колекцію MongoDB з лівого боку в меню <span className="text-blue-400 font-semibold">Sidebar</span>, 
              щоб почати роботу з документами, відправляти POST-форми або видаляти записи.
            </p>
          </div>
          <span className="text-xs text-blue-400 font-medium inline-flex items-center gap-1 font-mono group cursor-pointer hover:text-blue-300 transition-colors">
            Оберіть модуль зліва 
            <ArrowRight className="h-3 w-3 transform group-hover:translate-x-1 transition-transform" />
          </span>
        </div>

      </div>
    </div>
  );
}
