"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useAppStore } from "@/config/store";
import {
  Cpu, Globe, LogIn, LogOut, LayoutGrid,
  CreditCard, Search, Layers, Webhook, FileCode,
  Landmark, BookOpen, MessageSquare, PenTool, Loader2, ArrowUpRight
} from "lucide-react";

interface NavMobileProps {
  isOpen: boolean;
  onCloseAction: () => void;
  handleNavClickAction: (type: "pricing" | "reviews" | "blog" | "write_article" | "write_review") => void;
}

// Суворий інтерфейс для результатів нашого інтелектуального RAG-сканера
interface UnifiedSearchResult {
  id: string;
  source: "LOCAL_DATABASE" | "WIKIPEDIA" | "GOOGLE";
  title: string;
  snippet: string;
  link: string;
}

export default function NavMobile({ isOpen, onCloseAction, handleNavClickAction }: NavMobileProps) {
  const { data: session } = useSession();
  const { locale, t, setLocale, setAuthModal, setUpgradeModal, isHydrated } = useAppStore();

  const [searchCategory, setSearchCategory] = useState("AI_NODES");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Стейти для живого федеративного пошуку
  const [liveResults, setLiveResults] = useState<UnifiedSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // ІНЖЕНЕРНИЙ ФІКС ТС: Тепер реф суворо очікує HTMLFormElement для повної сумісності
  const dropdownRef = useRef<HTMLFormElement>(null);
  // Живий інтелектуальний пошук з ефектом Debounce прямо всередині мобільного меню
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setLiveResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Опитуємо наш всеїдний пошуковий шлюз-мутант
        const res = await fetch(`/api/v1/search?query=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json().catch(() => ({}));

        if (res.ok && data.success) {
          let filtered: UnifiedSearchResult[] = data.results || [];
          if (searchCategory !== "ALL") {
            if (searchCategory === "AI_NODES") {
              filtered = filtered.filter(r => r.source === "LOCAL_DATABASE");
            } else if (searchCategory === "LOGS") {
              filtered = filtered.filter(r => r.source === "WIKIPEDIA");
            } else if (searchCategory === "FINANCES") {
              filtered = filtered.filter(r => r.source === "GOOGLE");
            }
          }
          setLiveResults(filtered.slice(0, 4)); // Обмежуємо до 4 результатів на мобілці
        }
      } catch (err) {
        console.error("🚨 [NavMobile Live Search Crash]:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400); // 400мс затримка для захисту лімітів Google API від спаму

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchCategory]);

  // Закриття випадаючих списків при кліку назовні
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  // Захист гідратації для Next.js 15
  if (!isHydrated) return null;

  const categories = [
    { id: "AI_NODES", label: locale === "ua" ? "ШІ Ноди" : "AI Nodes", icon: <Layers className="w-3.5 h-3.5 mr-1.5 text-cyan-400" /> },
    { id: "WEBHOOKS", label: locale === "ua" ? "Вебхуки" : "Webhooks", icon: <Webhook className="w-3.5 h-3.5 mr-1.5 text-violet-400" /> },
    { id: "LOGS", label: locale === "ua" ? "Вікі" : "Wiki", icon: <FileCode className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> },
    { id: "FINANCES", label: locale === "ua" ? "Google" : "Google", icon: <Landmark className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> },
  ];

  // ІНЖЕНЕРНИЙ ФІКС ТС: примусовий фоллбек на масив, що усуває помилку union-типу
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
    <div
      className="fixed inset-0 z-50 md:hidden flex flex-col p-4 font-mono text-sm overflow-y-auto border-l border-white/5"
      style={{ backgroundColor: "#140204", backgroundImage: "linear-gradient(to bottom, #140204, #0a0102)" }}
    >
      {/* Шапка мобільного меню */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4 select-none shrink-0">
        <Link href="/" onClick={onCloseAction} className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-blue-500" />
          <span className="font-black tracking-widest text-white text-xs uppercase">
            NEXT<span className="text-blue-500">OPS</span> // MOB
          </span>
        </Link>
        <button
          onClick={onCloseAction}
          className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold active:scale-95 transition cursor-pointer"
        >
          [ × CLOSE ]
        </button>
      </div>
      {/* Мобільний категорійний пошук + Живий інтелектуальний фід */}
      <form onSubmit={handleSearchSubmit} className="w-full mb-6 relative shrink-0" ref={dropdownRef}>
        <div className="flex border border-white/5 rounded-xl p-1 gap-1 items-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="inline-flex items-center shrink-0 text-neutral-300 hover:text-white border border-neutral-800 px-3 py-2 text-xs font-bold rounded-xl transition cursor-pointer"
            style={{ backgroundColor: "#140204" }}
          >
            {Array.isArray(currentCategory) ? categories[0].icon : currentCategory.icon}
            <span className="mr-1">{Array.isArray(currentCategory) ? categories[0].label : currentCategory.label}</span>
          </button>

          {isDropdownOpen && (
            <div className="absolute top-14 left-1.5 border border-neutral-800 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] w-44 p-1.5 z-50" style={{ backgroundColor: "#140204" }}>
              <ul className="space-y-1 text-xs font-bold text-neutral-400">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <button
                      type="button"
                      onClick={() => { setSearchCategory(cat.id); setIsDropdownOpen(false); }}
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
            className="flex-1 px-3 py-2 bg-transparent text-white text-xs font-mono focus:outline-none placeholder-neutral-600"
            placeholder={locale === "ua" ? "Пошук по кластеру..." : "Search cluster..."}
            required
          />

          <button
            type="submit"
            className="p-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black rounded-xl transition shrink-0 cursor-pointer"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>

        {/* ЖИВИЙ ВИПАДАЮЧИЙ СПИСОК РЕЗУЛЬТАТІВ ШЛЮЗУ-МУТАНТА */}
        {liveResults.length > 0 && (
          <div className="absolute top-14 left-0 right-0 mt-1 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl p-2 z-45 space-y-1.5 max-h-60 overflow-y-auto">
            {liveResults.map((res) => (
              <a
                key={res.id}
                href={res.link}
                target={res.source === "LOCAL_DATABASE" ? "_self" : "_blank"}
                rel="noopener noreferrer"
                onClick={onCloseAction}
                className="block p-2.5 rounded-lg bg-neutral-900/60 border border-white/5 hover:border-blue-500/40 transition text-left space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded border border-white/10 text-neutral-400 bg-black/40">
                    {res.source}
                  </span>
                  <ArrowUpRight className="w-3 h-3 text-neutral-600" />
                </div>
                <h4 className="text-xs font-bold text-white truncate font-mono">{res.title}</h4>
                <p className="text-[10px] text-neutral-500 truncate font-sans">{res.snippet}</p>
              </a>
            ))}
          </div>
        )}
      </form>
      {/* Кнопки мобільної навігації */}
      <nav className="flex flex-col gap-3 mb-6 border-b border-white/5 pb-6 select-none shrink-0">
        <button onClick={() => { handleNavClickAction("pricing"); onCloseAction(); }}
          className="w-full py-3 border border-neutral-800 text-left px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-neutral-300 active:text-blue-400 cursor-pointer"
          style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
        >
          {locale === "ua" ? "[ 📊 Тарифні плани ]" : "[ 📊 Pricing Tiers ]"}
        </button>
        <button onClick={() => { handleNavClickAction("reviews"); onCloseAction(); }}
          className="w-full py-3 border border-neutral-800 text-left px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-neutral-300 active:text-cyan-400 cursor-pointer"
          style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
        >
          {locale === "ua" ? "[ 📢 Відгуки інженерів ]" : "[ 📢 Dev Reviews ]"}
        </button>
        <button onClick={() => { handleNavClickAction("blog"); onCloseAction(); }}
          className="w-full py-3 border border-neutral-800 text-left px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-neutral-300 active:text-purple-400 cursor-pointer"
          style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
        >
          {locale === "ua" ? "[  Технічний блог ]" : "[  Core Articles ]"}
        </button>

        {session && (
          <>
            <button onClick={() => { handleNavClickAction("write_review"); onCloseAction(); }}
              className="w-full py-3 border border-cyan-950 text-left px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-cyan-400 active:scale-[0.99] transition cursor-pointer flex items-center gap-2"
              style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
            >
              <PenTool className="w-3.5 h-3.5 text-cyan-400" />
              {locale === "ua" ? "[ + Додати новий відгук ]" : "[ + Add Live Review ]"}
            </button>
            <button onClick={() => { handleNavClickAction("write_article"); onCloseAction(); }}
              className="w-full py-3 border border-fuchsia-950 text-left px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-fuchsia-400 active:scale-[0.99] transition cursor-pointer flex items-center gap-2"
              style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
            >
              <BookOpen className="w-3.5 h-3.5 text-fuchsia-400" />
              {locale === "ua" ? "[ + Опублікувати статтю ]" : "[ + Publish Manifest ]"}
            </button>
          </>
        )}

        <Link href="/docs" onClick={onCloseAction}
          className="w-full py-3 border border-neutral-800 text-left px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-neutral-300 block font-mono"
          style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
        >
          [ 📡 API Reference ]
        </Link>
      </nav>

      {/* Зона локалізації та системних сесій */}
      <div className="mt-auto flex flex-col gap-3 shrink-0">
        <button onClick={() => setLocale(locale === "ua" ? "en" : "ua")}
          className="w-full py-3 rounded-xl border border-white/5 text-neutral-400 flex items-center justify-center gap-2 font-bold text-xs uppercase cursor-pointer"
          style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
        >
          <Globe className="w-4 h-4 text-blue-500" />
          <span>{locale === "ua" ? "Мова" : "Language"}: {locale}</span>
        </button>

        {session ? (
          <div className="grid grid-cols-2 gap-2">
            <Link href="/admin" onClick={onCloseAction}
              className="py-3 border border-white/5 text-center text-white font-black text-xs uppercase rounded-xl flex items-center justify-center gap-2 font-mono"
              style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
            >
              <LayoutGrid className="w-4 h-4 text-cyan-400" /> Workspace
            </Link>
            <button onClick={() => { setUpgradeModal(true); onCloseAction(); }}
              className="py-3 border border-blue-500/20 text-center text-blue-400 font-black text-xs uppercase rounded-xl flex items-center justify-center gap-2 cursor-pointer font-mono"
              style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
            >
              <CreditCard className="w-4 h-4" /> Upgrade
            </button>
            <button onClick={() => signOut()}
              className="col-span-2 py-3 border border-red-950 text-center text-red-400 font-black text-xs uppercase rounded-xl flex items-center justify-center gap-2 cursor-pointer font-mono"
              style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
            >
              <LogOut className="w-4 h-4" /> {t.actions.logout}
            </button>
          </div>
        ) : (
          <button onClick={() => { setAuthModal(true); onCloseAction(); }}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-black text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 cursor-pointer font-mono"
          >
            <LogIn className="w-4 h-4" />
            <span>{t.actions.login}</span>
          </button>
        )}
      </div>
    </div>
  );
}
