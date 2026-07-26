"use client";

import React from "react";
import { useAppStore } from "@/config/store";

export default function HeroContent() {
  // Напряму забираємо і тексти, і функцію відкриття модалки з нашого Zustand
  const { t, setAuthModal } = useAppStore();

  return (
    <div className="flex flex-col space-y-6 max-w-2xl text-left select-none">
      
      {/* Маленький преміальний неоновий бейдж-реліз */}
      <div className="inline-flex items-center w-fit px-3 py-1 text-xs 
      font-bold uppercase tracking-widest bg-blue-500/10
       text-blue-400 border border-blue-500/20 rounded-full 
       shadow-[0_0_15px_rgba(59,130,246,0.1)]">
        ✨ Enterprise Release v1.0
      </div>

      {/* Головний промисловий заголовок */}
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight 
      leading-none text-white">
        {t.hero.title}
      </h1>

      {/* Підзаголовок */}
      <p className="text-blue-500 font-bold uppercase tracking-wider text-sm sm:text-base">
        {t.hero.subtitle}
      </p>

      {/* Опис можливостей платформи */}
      <p className="text-neutral-400 text-base sm:text-lg leading-relaxed font-medium">
        {t.hero.description}
      </p>

      {/* Блок неонових інтерактивних кнопок */}
      <div className="flex flex-wrap items-center gap-4 pt-2">
        <button
          onClick={() => setAuthModal(true)}
          className="px-6 py-3.5 text-sm font-bold uppercase tracking-wider
           bg-blue-600 hover:bg-blue-500 text-white rounded-xl 
           shadow-lg shadow-blue-600/20 border border-blue-500/30 
           transition-all duration-200 active:scale-95"
        >
          {t.hero.startFreeBtn}
        </button>

        <button
          onClick={() => useAppStore.getState().setUpgradeModal(true)}
          className="px-6 py-3.5 text-sm font-bold uppercase tracking-wider
           bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-xl 
           border border-neutral-800 transition-all duration-200"
        >
          {t.hero.activateProBtn}
        </button>
      </div>

    </div>
  );
}
