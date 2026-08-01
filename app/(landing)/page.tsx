"use client";

import React from "react";
import Navbar from "@/components/Home/Navbar"; 
import Hero from "@/components/Home/Hero";
import TariffGrid from "@/components/Home/TariffGrid";
import ReviewSection from "@/components/Home/ReviewSection";
import Footer from "@/components/Home/Footer";
import AuthModal from "@/components/Modals/AuthModal";
import UpgradePlanModal from "@/components/Modals/UpgradePlanModal";
import { useAppStore } from "@/config/store";

export default function HomePage() {
  // Витягуємо прапорці інтерактивної видимості блоків та модалок із Zustand-стору
  const { 
    isPricingVisible, 
    isReviewsVisible, 
    isUpgradeModalOpen, 
    setUpgradeModal 
  } = useAppStore();

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-neutral-950 text-white overflow-x-hidden">
      
      {/* Промислова неонова технологічна сітка на тлі всього сайту */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* 1. Глобальне меню */}
      <Navbar />

      {/* 2. Контентна інтерактивна SPA-зона платформи */}
      <main className="flex-1 w-full relative z-10 flex flex-col items-center">
        
        {/* Блок А: Головний екран платформи */}
        <Hero />

        {/* Блок Б: Професійна сітка цін та тарифів (З'являється по кліку в меню) */}
        {isPricingVisible && (
          <div className="w-full border-t border-neutral-900 bg-neutral-950/20">
            <TariffGrid />
          </div>
        )}

        {/* Блок В: Аналітика відгуків розробників (З'являється по кліку в меню) */}
        {isReviewsVisible && (
          <div className="w-full border-t border-neutral-900 bg-neutral-950/20">
            <ReviewSection />
          </div>
        )}

      </main>

      {/* 3. Єдиний стабільний автономний підвал сайту */}
      <Footer />

      {/* 4. Глобальна модалка авторизації */}
      <AuthModal />

      {/* 5. Наша оновлена платіжна модалка картки з фіксом onCloseAction для Next.js 15 */}
      <UpgradePlanModal 
        isOpen={isUpgradeModalOpen} 
        onCloseAction={() => setUpgradeModal(false)} 
      />

    </div>
  );
}
