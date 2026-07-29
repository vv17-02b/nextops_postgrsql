// C:\Users\Admin\Documents\my-unified-work-space\components\Home\Navbar.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useAppStore } from "@/config/store";
import {
  Cpu, Globe, LogIn, LogOut, LayoutGrid,
  CreditCard, Terminal, Search, Layers,
  Webhook, FileCode, Landmark, Menu
} from "lucide-react";
import NavMobile from "./NavMobile";

export default function Navbar() {
  const { data: session } = useSession();
  const {
    locale, t, setLocale, setAuthModal, setUpgradeModal,
    setPricingVisible, setReviewsVisible, isPricingVisible, isReviewsVisible
  } = useAppStore();

  // Локальні стейти для кібер-пошуку та мобільного меню
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchCategory, setSearchCategory] = useState("AI_NODES");
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Кастомна low-code категорійна матриця для пошуку
  const categories = [
    { id: "AI_NODES", label: locale === "ua" ? "ШІ Ноди" : "AI Nodes", icon: <Layers className="w-3.5 h-3.5 mr-1.5 text-cyan-400" /> },
    { id: "WEBHOOKS", label: locale === "ua" ? "Вебхуки" : "Webhooks", icon: <Webhook className="w-3.5 h-3.5 mr-1.5 text-violet-400" /> },
    { id: "LOGS", label: locale === "ua" ? "Логи HTTP" : "HTTP Logs", icon: <FileCode className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> },
    { id: "FINANCES", label: locale === "ua" ? "FinOps" : "FinOps", icon: <Landmark className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> },
  ];

  const currentCategory = categories.find(c => c.id === searchCategory) || categories[0];

  // Функція індустріального плавного скролу до секцій лендінгу
  const handleNavClick = (type: "pricing" | "reviews" | "blog") => {
    if (type === "pricing") {
      setPricingVisible(!isPricingVisible);
      setReviewsVisible(false);
    } else if (type === "reviews") {
      setReviewsVisible(!isReviewsVisible);
      setPricingVisible(false);
    } else {
      setPricingVisible(true);
      setReviewsVisible(true);
    }

    setTimeout(() => {
      window.scrollTo({ top: type === "blog" ? 1800 : 700, behavior: "smooth" });
    }, 150);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    console.log(`[DESKTOP_SEARCH]: ${searchCategory} -> ${searchQuery}`);
    if (session) {
      window.location.href = `/admin?search_target=${searchCategory}&q=${encodeURIComponent(searchQuery)}`;
    } else {
      setAuthModal(true);
    }
  };
  return (
    <header className="w-full bg-neutral-950/70 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40 select-none font-mono text-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Головний логотип */}
        <Link href="/" className="flex items-center gap-2.5 group cursor-pointer shrink-0">
          <Cpu className="w-5 h-5 text-blue-500 group-hover:rotate-90 transition duration-500" />
          <span className="font-black tracking-widest text-white text-sm uppercase">NEXT<span className="text-blue-500">OPS</span> // HUB</span>
        </Link>

        {/* =================================================================
               🔍 ДЕСКТОПНИЙ КІБЕР-ПОШУК З ДРОПДАУНОМ (ТВІЙ ПРИКЛАД В ТАЙЛВІНДІ)
           ================================================================= */}
        <form onSubmit={handleSearchSubmit} className="hidden lg:block max-w-xl flex-1 mx-4 relative overflow-visible">
          <div className="flex bg-neutral-900/40 border border-white/5 rounded-xl p-1 gap-1 items-center">

            {/* Селектор категорій */}
            <button
              type="button"
              onClick={() => setIsSearchDropdownOpen(!isSearchDropdownOpen)}
              className="inline-flex items-center shrink-0 text-neutral-400 hover:text-white bg-neutral-950/80 border border-neutral-800 px-3 py-1.5 text-xs font-bold rounded-lg focus:outline-none transition relative"
            >
              {currentCategory.icon}
              <span className="mr-1">{currentCategory.label}</span>
              <svg className="w-3 h-3 text-neutral-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" /></svg>
            </button>

            {/* Дропдаун меню вибору */}
            {isSearchDropdownOpen && (
              <div className="absolute top-14 left-1 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl w-44 p-1.5 z-50 animate-fadeIn">
                <ul className="space-y-1 text-xs font-bold text-neutral-400">
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <button
                        type="button"
                        onClick={() => { setSearchCategory(cat.id); setIsSearchDropdownOpen(false); }}
                        className="w-full flex items-center p-2 hover:bg-neutral-900 hover:text-white rounded-lg text-left transition"
                      >
                        {cat.icon}
                        <span>{cat.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Текстовий інпут пошуку */}
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-2.5 py-1.5 bg-transparent text-white text-xs font-mono focus:outline-none placeholder-neutral-600"
              placeholder={locale === "ua" ? "Пошук нод..." : "Search corporate nodes..."}
              required
            />

            {/* Кнопка запуску команди */}
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition focus:outline-none font-mono tracking-wider shrink-0 shadow-md active:scale-95"
            >
              <Search className="w-3.5 h-3.5" />
              <span>SEARCH</span>
            </button>
          </div>
        </form>

        {/* Навігація для десктопу */}
        <nav className="hidden md:flex items-center gap-6 shrink-0">
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
          <button
            onClick={() => handleNavClick("blog")}
            className="cursor-pointer transition uppercase tracking-wider text-xs font-bold text-violet-400 hover:text-white"
          >
            {locale === "ua" ? "[ 📝 Статті ]" : "[ 📝 Articles ]"}
          </button>
          <Link href="/docs" className="text-neutral-400 hover:text-white transition uppercase tracking-wider text-xs font-bold">[ Docs ]</Link>
          <Link href="/blog" className="text-neutral-600 hover:text-neutral-400 transition uppercase tracking-wider text-[10px] font-bold border border-neutral-900 px-2 py-0.5 rounded-md">[ + Write ]</Link>
        </nav>

        {/* Керуюча зона для десктопу */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
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
                className="px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition flex items-center gap-2 cursor-pointer font-black text-xs uppercase tracking-wider shadow-md"
              >
                <CreditCard className="w-4 h-4" />
                <span className="hidden sm:inline">Upgrade</span>
              </button>
              <button
                onClick={() => signOut()}
                className="p-2 rounded-xl bg-neutral-900 border border-white/5 text-red-400 hover:bg-red-950/20 transition flex items-center cursor-pointer"
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

                {/* Бургер-кнопка для мобільних екранів */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden p-2 rounded-xl bg-neutral-900 border border-white/5 text-neutral-400 hover:text-white transition active:scale-95 cursor-pointer animate-pulse"
        >
          <Menu className="w-5 h-5" />
        </button>

      </div>

      {/* =================================================================
               🔥 ФІКС TS 2322: Передаємо оновлені імена пропсів Action!
         ================================================================= */}
      <NavMobile 
        isOpen={isMobileMenuOpen} 
        onCloseAction={() => setIsMobileMenuOpen(false)} 
        handleNavClickAction={handleNavClick}
      />
    </header>
  );
}
