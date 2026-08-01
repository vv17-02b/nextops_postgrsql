"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useAppStore } from "@/config/store";
import {
  Cpu, Globe, LogIn, LogOut, LayoutGrid,
  CreditCard, Search, Layers, Webhook, FileCode, Landmark, BookOpen, MessageSquare, PenTool
} from "lucide-react";

interface NavMobileProps {
  isOpen: boolean;
  onCloseAction: () => void;
  // 🔥 ГОЛОВНИЙ ФІКС ТИПІЗАЦІЇ: Розширюємо типи під 5 бойових кнопок, щоб пройти yarn build!
  handleNavClickAction: (type: "pricing" | "reviews" | "blog" | "write_article" | "write_review") => void;
}

export default function NavMobile({ isOpen, onCloseAction, handleNavClickAction }: NavMobileProps) {
  const { data: session } = useSession();
  const { locale, t, setLocale, setAuthModal, setUpgradeModal } = useAppStore();

  const [searchCategory, setSearchCategory] = useState("AI_NODES");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const categories = [
    { id: "AI_NODES", label: locale === "ua" ? "ШІ Ноди" : "AI Nodes", icon: <Layers className="w-3.5 h-3.5 mr-1.5 text-cyan-400" /> },
    { id: "WEBHOOKS", label: locale === "ua" ? "Вебхуки" : "Webhooks", icon: <Webhook className="w-3.5 h-3.5 mr-1.5 text-violet-400" /> },
    { id: "LOGS", label: locale === "ua" ? "Логи" : "Logs", icon: <FileCode className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> },
    { id: "FINANCES", label: locale === "ua" ? "FinOps" : "FinOps", icon: <Landmark className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> },
  ];

  const currentCategory = categories.find(c => c.id === searchCategory) || categories[0];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    onCloseAction();
    if (session) {
      window.location.href = `/admin?search_target=${searchCategory}&q=${encodeURIComponent(searchQuery)}`;
    } else {
      setAuthModal(true);
    }
  };
  return (
    /* ФIКС БЕКГРАУНДУ: Залізна матова підкладка Crimson-950, яка повністю перекриває текст та графіки лендінгу */
    <div
      className="fixed inset-0 z-50 md:hidden flex flex-col p-4 font-mono text-sm overflow-y-auto
       border-l border-white/5"
      style={{ backgroundColor: "#140204", backgroundImage: "linear-gradient(to bottom, #140204, #0a0102)" }}
    >

      {/* Шапка мобільного меню */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4 select-none shrink-0">
        <Link href="/" onClick={onCloseAction} className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-blue-500" />
          <span className="font-black tracking-widest text-white text-xs uppercase">
            NEXT<span className="text-blue-500">OPS</span> // MOB</span>
        </Link>
        <button onClick={onCloseAction} 
        className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 
        rounded-xl text-xs font-bold active:scale-95 transition cursor-pointer">
          [ × CLOSE ]
        </button>
      </div>

      {/* Мобільний категорійний пошук */}
      <form onSubmit={handleSearchSubmit} className="w-full mb-6 relative z-30 shrink-0">
        <div className="flex border border-white/5 rounded-xl p-1 gap-1 items-center"
         style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <button type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
          className="inline-flex items-center shrink-0 text-neutral-300 hover:text-white
           border border-neutral-800 px-3 py-2 text-xs font-bold rounded-xl transition cursor-pointer" 
           style={{ backgroundColor: "#140204" }}>
            {currentCategory.icon}

            <span className="hidden sm:inline mr-1">{currentCategory.label}</span>
            <svg className="w-3 h-3 ms-1 text-neutral-500" fill="none" 
            stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" /></svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute top-14 left-1.5 border border-neutral-800 
            rounded-xl shadow-2xl w-44 p-1.5 z-50" style={{ backgroundColor: "#140204" }}>
              <ul className="space-y-1 text-xs font-bold text-neutral-400">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <button type="button" 
                    onClick={() => { setSearchCategory(cat.id); setIsDropdownOpen(false); }} 
                    className="w-full flex items-center p-2 hover:bg-neutral-900
                     hover:text-white rounded-lg text-left transition cursor-pointer">
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
            className="flex-1 px-3 py-2 bg-transparent text-white text-xs 
            font-mono focus:outline-none placeholder-neutral-600"
            placeholder={locale === "ua" ? "Пошук по кластеру..." : "Search cluster..."}
            required
          />

          <button type="submit" 
          className="p-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black rounded-xl 
          transition shrink-0 cursor-pointer">
            <Search className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Кнопки мобільної навігації */}
      <nav className="flex flex-col gap-3 mb-6 border-b border-white/5 pb-6 select-none shrink-0">
        <button onClick={() => { handleNavClickAction("pricing"); onCloseAction(); }} 
        className="w-full py-3 border border-neutral-800 text-left px-4 rounded-xl 
        text-xs font-bold uppercase tracking-wider text-neutral-300 active:text-blue-400 cursor-pointer" 
        style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
          {locale === "ua" ? "[ 📊 Тарифні плани ]" : "[ 📊 Pricing Tiers ]"}
        </button>
        <button onClick={() => { handleNavClickAction("reviews"); onCloseAction(); }}
         className="w-full py-3 border border-neutral-800 text-left px-4 rounded-xl text-xs
          font-bold uppercase tracking-wider text-neutral-300 active:text-cyan-400 cursor-pointer" 
           style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
          {locale === "ua" ? "[ 📢 Відгуки інженерів ]" : "[ 📢 Dev Reviews ]"}
        </button>
        <button onClick={() => { handleNavClickAction("blog"); onCloseAction(); }} 
        className="w-full py-3 border border-neutral-800 text-left px-4 rounded-xl 
        text-xs font-bold uppercase tracking-wider text-neutral-300 active:text-purple-400
         cursor-pointer" style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
          {locale === "ua" ? "[  Технічний блог ]" : "[  Core Articles ]"}
        </button>

        {/*  МOБІЛЬНІ КНOПКИ ВИКЛИКУ МOДАЛЬНИХ ВІКOН СТВOРЕННЯ КОНТЕНТУ */}
        {session && (
          <>
            <button onClick={() => { handleNavClickAction("write_review"); onCloseAction(); }}
             className="w-full py-3 border border-cyan-950 text-left px-4 rounded-xl text-xs
              font-bold uppercase tracking-wider text-cyan-400 active:scale-[0.99] transition
               cursor-pointer flex items-center gap-2" style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
              <PenTool className="w-3.5 h-3.5 text-cyan-400" />
              {locale === "ua" ? "[ + Додати новий відгук ]" : "[ + Add Live Review ]"}
            </button>
            <button onClick={() => { handleNavClickAction("write_article"); 
              onCloseAction(); }} className="w-full py-3 border border-fuchsia-950 text-left px-4 
              rounded-xl text-xs font-bold uppercase tracking-wider text-fuchsia-400 
              active:scale-[0.99] transition cursor-pointer flex items-center gap-2" 
              style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
              <BookOpen className="w-3.5 h-3.5 text-fuchsia-400" />
              {locale === "ua" ? "[ + Опублікувати статтю ]" : "[ + Publish Manifest ]"}
            </button>
          </>
        )}

        <Link href="/docs" onClick={onCloseAction} 
        className="w-full py-3 border border-neutral-800 text-left px-4 rounded-xl 
        text-xs font-bold uppercase tracking-wider text-neutral-300 block font-mono"
         style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
          [ 📡 API Reference ]
        </Link>
      </nav>

      {/* Зона локалізації та системних сесій */}
      <div className="mt-auto flex flex-col gap-3 shrink-0">
        <button onClick={() => setLocale(locale === "ua" ? "en" : "ua")}
         className="w-full py-3 rounded-xl border border-white/5 text-neutral-400 flex 
         items-center justify-center gap-2 font-bold text-xs uppercase cursor-pointer" 
         style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
          <Globe className="w-4 h-4 text-blue-500" />
          <span>{locale === "ua" ? "Мова" : "Language"}: {locale}</span>
        </button>

        {session ? (
          <div className="grid grid-cols-2 gap-2">
            <Link href="/admin" onClick={onCloseAction} 
            className="py-3 border border-white/5 text-center text-white font-black 
            text-xs uppercase rounded-xl flex items-center justify-center gap-2 font-mono" 
            style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
              <LayoutGrid className="w-4 h-4 text-cyan-400" /> Workspace
            </Link>
            <button onClick={() => { setUpgradeModal(true); onCloseAction(); }} 
            className="py-3 border border-blue-500/20 text-center text-blue-400 
            font-black text-xs uppercase rounded-xl flex items-center justify-center
             gap-2 cursor-pointer font-mono" style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
              <CreditCard className="w-4 h-4" /> Upgrade
            </button>
            <button onClick={() => signOut()}
             className="col-span-2 py-3 border border-red-950 text-center
              text-red-400 font-black text-xs uppercase rounded-xl flex items-center 
              justify-center gap-2 cursor-pointer font-mono" style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
              <LogOut className="w-4 h-4" /> {t.actions.logout}
            </button>
          </div>
        ) : (
          <button onClick={() => { setAuthModal(true); onCloseAction(); }} 
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600
           text-white font-black text-xs uppercase tracking-widest rounded-xl flex 
           items-center justify-center gap-2 cursor-pointer font-mono">
            <LogIn className="w-4 h-4" />
            <span>{t.actions.login}</span>
          </button>
        )}
      </div>

    </div>
  );
}
