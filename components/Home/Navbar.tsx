"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useAppStore } from "@/config/store";
import { useWorkspace } from "@/context/WorkspaceContext";

// 📡 ПРЯМИЙ ІМПОРТ З ВЖЕ НАЯВНОГО ПАКЕТУ LUCIDE-REACT (ПОВНІСТЮ ОПТИМІЗОВАНО ПІД TURBOPACK)
import {
  Cpu, Globe, LogIn, LogOut, LayoutGrid, CreditCard, Terminal, Search,
  Layers, Webhook, FileCode, Landmark, Menu, X, BookOpen, MessageSquare, PenTool
} from "lucide-react";

import NavMobile from "./NavMobile";
import CreateContentModal from "../Modals/CreateContentModal";

export default function Navbar() {
  const { data: session } = useSession();
  const { refreshWorkspace } = useWorkspace();

  const {
    locale, t, setLocale, setAuthModal, setUpgradeModal,
    setPricingVisible, setReviewsVisible, initLanguage
  } = useAppStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchCategory, setSearchCategory] = useState("AI_NODES");
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [contentModalType, setContentModalType] = useState<"article" | "review" | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    initLanguage();
    setIsMounted(true);
  }, [initLanguage]);

  const categories = [
    { id: "AI_NODES", label: locale === "ua" ? "ШІ Ноди" : "AI Nodes", icon: <Layers className="w-3.5 h-3.5 mr-1.5 text-cyan-400" /> },
    { id: "WEBHOOKS", label: locale === "ua" ? "Вебхуки" : "Webhooks", icon: <Webhook className="w-3.5 h-3.5 mr-1.5 text-violet-400" /> },
    { id: "LOGS", label: locale === "ua" ? "Логи HTTP" : "HTTP Logs", icon: <FileCode className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> },
    { id: "FINANCES", label: locale === "ua" ? "FinOps" : "FinOps", icon: <Landmark className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> },
  ];

  // ФІКС ТИПІВ (ПОМИЛКА 2339): Строго повертаємо об'єкт категорії за замовчуванням, а не весь масив!
  const currentCategory = categories.find(c => c.id === searchCategory) || categories[0];
  const handleNavClick = (type: "pricing" | "reviews" | "blog" | "write_article" | "write_review") => {
    setIsMobileMenuOpen(false);

    if (type === "pricing") {
      setPricingVisible(true);
      setReviewsVisible(false);
      setTimeout(() => window.scrollTo({ top: 750, behavior: "smooth" }), 100);
    } else if (type === "reviews") {
      setReviewsVisible(true);
      setPricingVisible(false);
      setTimeout(() => window.scrollTo({ top: 1300, behavior: "smooth" }), 100);
    } else if (type === "blog") {
      setPricingVisible(true);
      setReviewsVisible(true);
      setTimeout(() => window.scrollTo({ top: 2100, behavior: "smooth" }), 100);
    } else if (type === "write_article") {
      setContentModalType("article");
      setIsContentModalOpen(true);
    } else if (type === "write_review") {
      setContentModalType("review");
      setIsContentModalOpen(true);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (session) {
      window.location.href = `/admin?search_target=${searchCategory}&q=${encodeURIComponent(searchQuery)}`;
    } else {
      setAuthModal(true);
    }
  };

  if (!isMounted) {
    return <header className="w-full h-16 bg-neutral-950/70 border-b border-white/5 sticky top-0 z-40" />;
  }

  return (
    <header className="w-full bg-neutral-950/70 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40 select-none font-mono text-sm">
      <div className="max-w-7xl mx-auto px-4">

        {/* ВЕРХНІЙ БЛОК НАВБАРУ */}
        <div className="h-16 flex items-center justify-between gap-4">

          {/* 1. Логотип системи */}
          <Link href="/" className="flex items-center gap-2 group cursor-pointer shrink-0">
            <Cpu className="w-4 h-4 text-blue-500 group-hover:rotate-90 transition duration-500" />
            <span className="font-black tracking-widest text-white text-xs sm:text-sm uppercase">
              NEXT<span className="text-blue-500">OPS</span>
            </span>
          </Link>

          {/* 2. Пошуковий шлюз (hidden lg:block) */}
          <form onSubmit={handleSearchSubmit} className="hidden lg:block max-w-2xl w-full mx-auto relative overflow-visible">
            <div className="flex bg-neutral-900/40 border border-white/5 rounded-xl p-1 gap-1 items-center">
              <button
                type="button"
                onClick={() => setIsSearchDropdownOpen(!isSearchDropdownOpen)}
                className="inline-flex items-center shrink-0 text-neutral-400 hover:text-white bg-neutral-950/80 border border-neutral-800 px-2 py-1.5 text-xs font-bold rounded-lg focus:outline-none transition relative cursor-pointer"
              >
                {currentCategory.icon}
                <span className="mr-1 hidden xl:inline">{currentCategory.label}</span>
                <svg className="w-3 h-3 text-neutral-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                </svg>
              </button>
              {isSearchDropdownOpen && (
                <div className="absolute top-14 left-1 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl w-44 p-1.5 z-50">
                  <ul className="space-y-1 text-xs font-bold text-neutral-400">
                    {categories.map((cat) => (
                      <li key={cat.id}>
                        <button
                          type="button"
                          onClick={() => { setSearchCategory(cat.id); setIsSearchDropdownOpen(false); }}
                          className="w-full flex items-center p-2 hover:bg-neutral-900 hover:text-white rounded-lg text-left transition cursor-pointer"
                        >
                          {cat.icon}
                          <span>{cat.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-2 py-1 bg-transparent text-white text-xs font-mono focus:outline-none placeholder-neutral-700"
                placeholder={locale === "ua" ? "Пошук нод..." : "Search nodes..."}
                required
              />

              <button type="submit" className="inline-flex items-center p-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition focus:outline-none shrink-0 cursor-pointer">
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* 3. Системні керуючі кнопки кабінету розробника (Десктоп) */}
          <div className="hidden md:flex items-center gap-1.5 xl:gap-2 shrink-0">
            <button onClick={() => setLocale(locale === "ua" ? "en" : "ua")} className="px-2 py-1.5 rounded-xl bg-neutral-900/60 border border-white/5 text-neutral-400 hover:text-white transition flex items-center gap-1 font-bold text-[11px] cursor-pointer">
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              <span className="uppercase">{locale}</span>
            </button>

            {session ? (
              <>
                <Link href="/workspace" className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-850 text-emerald-400 border border-white/5 rounded-xl transition font-black text-[11px] uppercase tracking-wider">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Sandbox</span>
                </Link>
                <Link href="/admin" className="inline-flex items-center gap-1 px-2.5 xl:px-3 py-1.5 bg-neutral-900 border border-white/5 hover:bg-neutral-850 text-white rounded-xl transition font-black text-[11px] uppercase tracking-wider shadow-md">
                  <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden xl:inline">Workspace</span>
                </Link>
                <button onClick={() => setUpgradeModal(true)} className="px-2.5 xl:px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition flex items-center gap-1.5 font-black text-[11px] uppercase tracking-wider shadow-sm cursor-pointer">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Upgrade</span>
                </button>
                <button onClick={() => signOut()} className="p-1.5 rounded-xl bg-neutral-900 border border-white/5 text-red-400 hover:bg-red-950/20 transition flex items-center cursor-pointer">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <button onClick={() => setAuthModal(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:brightness-110 text-white font-black rounded-xl shadow-lg transition uppercase tracking-widest text-[11px] cursor-pointer">
                <LogIn className="w-3.5 h-3.5" />
                <span>{t.actions.login}</span>
              </button>
            )}
          </div>

          {/* 4. ЄДИНА РОЗУМНА КНОПКА КЕРУВАННЯ З СУВОРИМ Z-INDEX */}
          <div className="flex items-center gap-2 md:hidden shrink-0 z-50">
            <button onClick={() => setLocale(locale === "ua" ? "en" : "ua")} className="px-2 py-1.5 rounded-xl bg-neutral-900/60 border border-white/5 text-neutral-400 hover:text-white transition text-[11px] font-bold font-mono uppercase">
              {locale}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-neutral-900 border border-white/5 text-neutral-400 hover:text-white transition active:scale-95 cursor-pointer flex items-center justify-center"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4 text-red-500" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

        </div>
        {/* НИЖНІЙ БЛОК НАВІГАЦІЇ: Прихований на мобільних */}
        <div className="hidden md:flex items-center justify-center gap-4 xl:gap-6 py-2.5 border-t border-white/5">
          <button onClick={() => handleNavClick("pricing")} className="cursor-pointer transition uppercase tracking-wider text-[10px] xl:text-xs font-bold text-neutral-400 hover:text-white">
            {locale === "ua" ? "Тарифи" : "Pricing"}
          </button>
          <button onClick={() => handleNavClick("reviews")} className="cursor-pointer transition uppercase tracking-wider text-[10px] xl:text-xs font-bold text-neutral-400 hover:text-white flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-blue-500" />
            {locale === "ua" ? "Відгуки" : "Reviews"}
          </button>
          <button onClick={() => handleNavClick("blog")} className="cursor-pointer transition uppercase tracking-wider text-[10px] xl:text-xs font-bold text-neutral-400 hover:text-white flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-violet-500" />
            {locale === "ua" ? "Статті" : "Articles"}
          </button>

          {session && (
            <>
              <button onClick={() => handleNavClick("write_review")} className="cursor-pointer transition uppercase tracking-wider text-[10px] xl:text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                <PenTool className="w-3 h-3" />
                {locale === "ua" ? "+Відгук" : "+Review"}
              </button>
              <button onClick={() => handleNavClick("write_article")} className="cursor-pointer transition uppercase tracking-wider text-[10px] xl:text-xs font-bold text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {locale === "ua" ? "+Стаття" : "+Article"}
              </button>
            </>
          )}

          <Link href="/docs" className="text-neutral-400 hover:text-white transition uppercase tracking-wider text-[10px] xl:text-xs font-bold">
            Docs
          </Link>
        </div> {/* Закриття нижнього рядка */}

      </div> {/* Закриття max-w-7xl контейнера */}

      <NavMobile
        isOpen={isMobileMenuOpen}
        onCloseAction={() => setIsMobileMenuOpen(false)}
        handleNavClickAction={handleNavClick}
      />

      <CreateContentModal
        isOpen={isContentModalOpen}
        type={contentModalType}
        onCloseAction={() => {
          setIsContentModalOpen(false);
          setContentModalType(null);
        }}
        onSuccessRefreshAction={async () => {
          await refreshWorkspace();
        }}
      />
    </header>
  );
}
