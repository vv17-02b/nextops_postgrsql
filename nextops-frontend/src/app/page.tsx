"use client";
import React, { useState, useEffect } from 'react';
import { Database, ArrowRight, Clock } from 'lucide-react';

export default function DashboardPage(): React.JSX.Element {
  const [time, setTime] = useState<string>('');

  // Живий годинник, який оновлюється кожну секунду
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const timeStr = now.toLocaleTimeString('uk-UA', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setTime(`${dateStr} | ${timeStr}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-custom-way p-6 md:p-12 space-y-10 font-sans max-w-6xl mx-auto w-full min-h-[calc(100vh-2rem)] flex flex-col justify-between pt-16 md:pt-20 relative">
      
      {/* Контейнер для верхнього контенту та карток */}
      <div className="space-y-10 w-full">
        
        {/* ГЛАВНИЙ БЛОК: Заголовок з обертанням неонового контуру */}
        <div className="relative overflow-hidden p-[1px] rounded-2xl bg-gray-800/80 max-w-3xl mx-auto mb-6 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          {/* Анімований неоновий градієнт на фоні заголовка */}
          <div className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 bg-[conic-gradient(from_0deg,transparent_30%,#3b82f6_60%,#8b5cf6_80%,#f43f5e_100%)] animate-[spin_8s_linear_infinite]" />
          
          {/* Внутрішня плашка тексту */}
          <div className="relative bg-gray-950/95 backdrop-blur-xl p-6 md:p-10 rounded-[15px] text-center space-y-4">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent drop-shadow-md">
              NextOps Studio Control Panel
            </h1>
            <p className="text-gray-400 text-sm md:text-base font-medium max-w-xl mx-auto leading-relaxed">
              Ласкаво просимо до вашої automated системи керування баз даних{' '}
              <code className="bg-gray-900/90 px-2.5 py-0.5 rounded text-blue-400 font-mono text-xs md:text-sm border border-gray-800/60 shadow-inner">
                nextops_db
              </code>.
            </p>
          </div>
        </div>

        {/* ІНФОРМАЦІЙНА СІТКА: Блоки з індивідуальними неоновими рамками */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          
          {/* Анімована картка: Статус системи */}
          <div className="relative overflow-hidden p-[1px] rounded-2xl bg-gray-800/60 shadow-2xl group transition-all duration-300 hover:shadow-[0_0_25px_rgba(52,211,153,0.15)]">
            {/* Смарагдово-фіолетове обертання для статусу системи */}
            <div className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 bg-[conic-gradient(from_90deg,transparent_40%,#10b981_70%,#8b5cf6_100%)] animate-[spin_10s_linear_infinite]" />
            
            {/* Внутрішній вміст картки */}
            <div className="relative bg-gray-950/90 backdrop-blur-md p-6 md:p-8 rounded-[15px] h-full flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-xs font-bold text-gray-400 uppercase tracking-widest font-mono border-b border-gray-800/40 pb-2">
                  <Database className="h-4 w-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
                  Статус системи
                </div>
                <p className="text-xs md:text-sm text-gray-400 leading-relaxed">
                  Усі 15 модулів успішно синхронізовано з NestJS бекендом за адресою{' '}
                  <code className="bg-gray-900/80 px-2 py-0.5 rounded text-gray-300 font-mono text-[11px] md:text-xs border border-gray-800/40">
                    127.0.0.1:3001
                  </code>.
                </p>
              </div>
              <div className="text-xs text-emerald-400 font-semibold inline-flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/20 px-4 py-1.5 rounded-xl w-max font-mono tracking-wide shadow-sm">
                <span className="text-emerald-500 animate-pulse text-sm">●</span> СЕРВЕР АКТИВНИЙ
              </div>
            </div>
          </div>

          {/* Анімована картка: Швидкий старт */}
          <div className="relative overflow-hidden p-[1px] rounded-2xl bg-gray-800/60 shadow-2xl group transition-all duration-300 hover:shadow-[0_0_25px_rgba(59,130,246,0.15)]">
            {/* Синьо-бурштинове обертання для швидкого старту (крутиться у зворотний бік) */}
            <div className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 bg-[conic-gradient(from_270deg,transparent_40%,#3b82f6_70%,#f59e0b_100%)] animate-[spin_12s_linear_infinite_reverse]" />
            
            {/* Внутрішній вміст картки */}
            <div className="relative bg-gray-950/90 backdrop-blur-md p-6 md:p-8 rounded-[15px] h-full flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono border-b border-gray-800/40 pb-2">
                  Швидкий старт
                </div>
                <p className="text-xs md:text-sm text-gray-400 leading-relaxed">
                  Оберіть будь-яку колекцію MongoDB з лівого боку в меню <span className="text-blue-400 font-semibold">Sidebar</span>, 
                  щоб почати роботу з документами, відправляти POST-форми або видаляти записи.
                </p>
              </div>
              <div className="pt-1">
                <span className="text-xs text-blue-400 font-bold inline-flex items-center gap-2 font-mono group cursor-pointer hover:text-blue-300 transition-colors bg-blue-500/5 border border-blue-500/20 px-4 py-1.5 rounded-xl tracking-wide shadow-sm">
                  ОБЕРІТЬ МОДУЛЬ ЗЛІВА 
                  <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform text-blue-400" />
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* НИЖНІЙ ПРАВИЙ КУТОК: Анімований блок системного часу */}
      <div className="w-full flex justify-end items-center pt-6 mt-auto border-t border-gray-800/10 select-none">
        <div className="relative overflow-hidden p-[1px] rounded-xl bg-gray-800 shadow-md">
          {/* Легке швидке обертання для віджету годинника */}
          <div className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 bg-[conic-gradient(from_0deg,transparent_50%,#3b82f6_80%,#ef4444_100%)] animate-[spin_5s_linear_infinite]" />
          
          {/* Внутрішня плашка годинника */}
          <div className="relative flex items-center gap-2 px-4 py-2 bg-gray-950/95 rounded-[11px] font-mono text-[11px] md:text-xs text-gray-300">
            <Clock className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
            <span className="tracking-wider font-semibold">{time || 'Синхронізація...'}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
