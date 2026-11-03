"use client";

import React from 'react';
import { LayoutDashboard, Database, ArrowRight } from 'lucide-react';

export default function DashboardPage(): React.JSX.Element {
  return (
    <div className="bg-custom-way p-6 md:p-8 space-y-6 font-sans max-w-6xl mx-auto 
    w-full min-h-[calc(100vh-2rem)]">
      
      {/* Головна картка: Напівпрозора з ефектом розмиття заднього фону */}
      <div className="relative overflow-hidden bg-gray-950/40 backdrop-blur-lg
       p-8 md:p-12 rounded-xl border border-white/10 shadow-2xl flex flex-col 
       items-center text-center space-y-4">
        <div className="inline-flex p-4 bg-blue-500/10 text-blue-400 rounded-xl shadow-inner">
          <LayoutDashboard className="h-8 w-8 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl md:text-4xl font-extrabold bg-gradient-to-r
           from-white via-gray-200 to-gray-400 bg-clip-text text-transparent tracking-tight">
            NextOps Studio Control Panel PostgresQl
          </h1>
          <p className="text-gray-200 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Ласкаво просимо до вашої автоматизованої системи керування базу даних{' '}
            <code className="bg-gray-950/80 px-2 py-1 rounded text-blue-400 
            font-mono text-sm border border-gray-800 ml-1 inline-block">
              nextops_db
            </code>.
          </p>
        </div>
      </div>

      {/* Сітка статусів */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Картка: Статус системи */}
        <div className="bg-gray-950/40 backdrop-blur-md p-6 rounded-xl 
        shadow-xl flex flex-col justify-between space-y-4 border border-white/5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold 
            text-gray-400 uppercase tracking-wider font-mono">
              <Database className="h-4 w-4 text-emerald-400" />
              Статус системи
            </div>
            <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
              Запити до NestJS backend спрямовуються через same-origin API proxy{' '}
              <code className="bg-gray-950/80 px-2 py-0.5 rounded text-gray-300 font-mono 
              text-[11px] md:text-xs border border-gray-800">
                /api/*
              </code>.
            </p>
          </div>
          <div className="text-xs text-emerald-400 font-medium inline-flex 
          items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full w-max font-mono">
            ● Маршрутизація API налаштована
          </div>
        </div>

        {/* Картка: Швидкий старт */}
        <div className="bg-gray-950/40 backdrop-blur-md p-6 rounded-xl 
        shadow-xl flex flex-col justify-between space-y-4 border border-white/5">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-400 uppercase 
            tracking-wider font-mono">Швидкий старт</h3>
            <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
              Оберіть будь-яку таблицю PostgreSQL з лівого боку в меню 
              <span className="text-blue-400 font-semibold">Sidebar</span>,
              щоб переглядати записи, відправляти POST-форми або видаляти записи.
            </p>
          </div>
          <span className="text-xs md:text-sm text-blue-400 font-medium inline-flex 
          items-center gap-1 font-mono group cursor-pointer hover:text-blue-300 transition-colors">
            Оберіть модуль зліва 
            <ArrowRight className="h-3 w-3 transform group-hover:translate-x-1 transition-transform" />
          </span>
        </div>

      </div>
    </div>
  );
}
