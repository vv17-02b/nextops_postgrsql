"use client";

import React from "react";

export default function Logo() {
  return (
    <div className="relative flex items-center justify-center w-9 h-9 select-none">
      
      {/* 1. Глобальне неонове тліюче кільце навколо (Ефект пульсації хабу) */}
      <span className="absolute animate-ping inline-flex h-full w-full rounded-xl bg-blue-500/20 opacity-60"></span>
      
      {/* 2. Зовнішній скляний контейнер з градієнтною рамкою */}
      <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 shadow-md group-hover:border-blue-500/40 transition-all duration-300">
        
        {/* 3. Головна векторна матрична іконка оркестратора */}
        <svg
          className="w-5 h-5 text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-transform duration-500 group-hover:rotate-90"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Верхній ромб — Матричний хаб */}
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          
          {/* Нижній рівень — Потік даних вебхуків */}
          <path d="M2 17l10 5 10-5" />
          
          {/* Середній рівень — Робочі вікна клієнта */}
          <path d="M2 12l10 5 10-5" />
        </svg>

        {/* 4. Маленький зелений світлодіод у кутку — статус стабільної роботи системи (yarn dev дихає рівно) */}
        <span className="absolute top-1 right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>

      </div>
    </div>
  );
}
