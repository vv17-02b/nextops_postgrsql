"use client";

import React from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useAppStore } from "@/config/store";
import { Cpu, Globe, LogIn, LogOut, LayoutGrid, CreditCard, Terminal } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();
  const { 
    locale, t, setLocale, setAuthModal, setUpgradeModal, 
    setPricingVisible, setReviewsVisible, isPricingVisible, isReviewsVisible 
  } = useAppStore();

  const handleNavClick = (type: "pricing" | "reviews" | "blog") => {
    if (type === "pricing") {
      setPricingVisible(!isPricingVisible);
      setReviewsVisible(false);
    } else if (type === "reviews") {
      setReviewsVisible(!isReviewsVisible);
      setPricingVisible(false);
    } else {
      // При кліку на Блог примусово тримаємо секції відкритими і скролимо вниз до статей
      setPricingVisible(true);
      setReviewsVisible(true);
    }
    
    setTimeout(() => {
      // Розраховуємо глибину скролу, щоб опустити екран точно до блоку BlogStream
      window.scrollTo({ top: type === "blog" ? 1800 : 700, behavior: "smooth" });
    }, 150);
  };

  return (
    <header className="w-full bg-neutral-950/70 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40 select-none font-mono text-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        
        <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
          <Cpu className="w-5 h-5 text-blue-500 group-hover:rotate-90 transition duration-500" />
          <span className="font-black tracking-widest text-white text-sm uppercase">NEXT<span className="text-blue-500">OPS</span> // HUB</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <button 
            onClick={() => handleNavClick("pricing")}
            className={`cursor-pointer transition uppercase tracking-wider text-xs font-bold ${isPricingVisible ? "text-blue-400" : "text-neutral-400 hover:text-white"}`}
          >
            {locale === "ua" ? "[ Тарифи ]" : "[ Pricing ]"}
          </button>
          <button 
            onClick={() => handleNavClick("reviews")}
            className={`cursor-pointer transition uppercase tracking-wider text-xs font-bold ${isReviewsVisible ? "text-cyan-400" : "text-neutral-400 hover:text-white"}`}
          >
            {locale === "ua" ? "[ Відгуки ]" : "[ Reviews ]"}
          </button>
          
          {/* 🔥 НАША НОВА ІНТЕРАКТИВНА КНОПКА ДЛЯ СКРОЛУ ДО СТАТЕЙ НА ГОЛОВНІЙ */}
          <button 
            onClick={() => handleNavClick("blog")}
            className="cursor-pointer transition uppercase tracking-wider text-xs font-bold text-violet-400 hover:text-white"
          >
            {locale === "ua" ? "[ 📝 Статті ]" : "[ 📝 Articles ]"}
          </button>
          
          <Link href="/docs" className="text-neutral-400 hover:text-white transition uppercase tracking-wider text-xs font-bold">[ Docs ]</Link>
          
          {/* Кнопка швидкого переходу до панелі створення статей розробника */}
          <Link href="/blog" className="text-neutral-600 hover:text-neutral-400 transition uppercase tracking-wider text-[10px] font-bold border border-neutral-900 px-2 py-0.5 rounded-md">[ + Write ]</Link>
        </nav>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setLocale(locale === "ua" ? "en" : "ua")}
            className="px-3 py-1.5 rounded-xl bg-neutral-900/60 border border-white/5 text-neutral-400 hover:text-white transition flex items-center gap-2 cursor-pointer font-bold"
          >
            <Globe className="w-4 h-4 text-blue-500" />
            <span className="uppercase text-xs tracking-wider">{locale}</span>
          </button>

          {session ? (
            <>
              <Link 
                href="/workspace" 
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-neutral-900 hover:bg-neutral-850 text-emerald-400 border border-white/5 rounded-xl transition cursor-pointer font-black text-xs uppercase tracking-wider shadow-lg"
                title="Open API Sandbox"
              >
                <Terminal className="w-4 h-4" />
                <span className="hidden lg:inline">Sandbox</span>
              </Link>

              <Link 
                href="/admin" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-white/5 hover:bg-neutral-850 text-white rounded-xl transition cursor-pointer font-black text-xs uppercase tracking-wider shadow-lg"
              >
                <LayoutGrid className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">Workspace</span>
              </Link>

              <button 
                onClick={() => setUpgradeModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition flex items-center gap-2 cursor-pointer font-black text-xs uppercase tracking-wider animate-pulse shadow-md"
              >
                <CreditCard className="w-4 h-4" />
                <span className="hidden sm:inline">Upgrade</span>
              </button>

              <button 
                onClick={() => signOut()}
                className="p-2 rounded-xl bg-neutral-900 border border-white/5 text-red-400 hover:bg-red-950/20 transition flex items-center cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button 
              onClick={() => setAuthModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:brightness-110 text-white font-black rounded-xl shadow-lg shadow-blue-500/10 transition cursor-pointer uppercase tracking-widest text-xs"
            >
              <LogIn className="w-4 h-4" />
              <span>{t.actions.login}</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
}
