"use client";

import React from "react";
import { useAppStore } from "@/config/store";
import HeroContent from "./HeroContent";
import UserSlider from "./UserSlider";
import PlatformPreview from "./PlatformPreview";

export default function Hero() {
  const { t } = useAppStore();
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 pt-4 pb-12 flex 
    flex-col space-y-10 overflow-hidden relative">
      
      {/* КАРТИНКА ПЛАТФОРМИ coding.jpg СУВОРO ПІД НАВБАРОМ НА ВСЮ ШИРИНУ */}
      <div className="w-full relative z-10">
        <PlatformPreview />
      </div>

      {/* НИЖНЯ СІТКА ЕКРАНУ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10 pt-2">
   
        {/* ЛІВА СТОРОНА: Тексти та кнопки */}
        <div className="lg:col-span-7 w-full space-y-4">
          <HeroContent />
        </div>

        {/* ПРАВА СТОРОНА: Опис взаємодії користувачів + Слайдер */}
        <div className="lg:col-span-5 w-full space-y-4">
          <div className="border border-neutral-900 bg-neutral-950/40 p-5 rounded-2xl shadow-inner space-y-3">
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-blue-500 animate-pulse">
                {t.hero.userActivityTitle}
              </h4>
              <p className="text-[11px] text-neutral-500 mt-1 font-medium leading-relaxed">
                {t.hero.userActivityDesc}
              </p>
            </div>
            
            {/* Сама жива вертикальна карусель розробників */}
            <UserSlider />
          </div>
        </div>

      </div>

    </section>
  );
}
