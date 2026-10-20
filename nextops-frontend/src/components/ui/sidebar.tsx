"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Terminal, Menu, X, Database, Search,
  User, ShieldCheck, Key, FolderHeart, Cpu, BarChart3, 
  Layers, MessageSquare, ShieldAlert, ShoppingBag, 
  Coins, Box, Activity, Sliders
} from 'lucide-react';

interface SidebarLink {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const links: SidebarLink[] = [
    { name: 'Account', href: '/account', icon: Key },
    { name: 'AgentKnowledgeBase', href: '/agentknowledgebase', icon: Cpu },
    { name: 'ApiHistory', href: '/apihistory', icon: Activity },
    { name: 'Category', href: '/category', icon: Layers },
    { name: 'Order', href: '/order', icon: ShoppingBag },
    { name: 'OrderItem', href: '/orderitem', icon: Coins },
    { name: 'Product', href: '/product', icon: Box },
    { name: 'Project', href: '/project', icon: FolderHeart },
    { name: 'Review', href: '/review', icon: MessageSquare },
    { name: 'Session', href: '/session', icon: ShieldCheck },
    { name: 'User', href: '/user', icon: User },
    { name: 'UserAiBudget', href: '/useraibudget', icon: BarChart3 },
    { name: 'VerificationToken', href: '/verificationtoken', icon: ShieldAlert },
    { name: 'Warehouse', href: '/warehouse', icon: Sliders },
    { name: 'WebhookConfig', href: '/webhookconfig', icon: Terminal }
];

export default function Sidebar(): React.JSX.Element {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [, setIsPostmanOpen] = useState<boolean>(false);
  const [, setIsTerminalOpen] = useState<boolean>(false); 
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false); 

  // Тригер для перевірки повної гідратації клієнта
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const filteredLinks = useMemo(() => {
    return links.filter(link => 
      link.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Доки клієнтська частина не ініціалізована, повертаємо порожній блок
  // Це запобігає будь-яким розбіжностям класів чи текстів з сервером (SSR)
  if (!isMounted) {
    return <div className="w-64 bg-gray-900 hidden md:block h-screen fixed left-0 top-0 border-r border-gray-800" />;
  }

  return (
    <>
      <button 
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-30 p-2 bg-gray-900 text-white rounded-lg shadow-md border border-gray-800"
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside className={`w-64 bg-gray-900 text-gray-400 flex flex-col h-screen fixed left-0 top-0 border-r border-gray-800 z-20 font-sans shadow-[6px_0_30px_rgba(0,0,0,0.4)] transition-transform duration-300 md:translate-x-0 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        <Link 
          href="/" 
          prefetch={false}
          onClick={() => setIsMobileOpen(false)}
          className="p-5 border-b border-gray-800 flex items-center gap-3 text-white font-bold h-16 shrink-0 select-none hover:bg-gray-800/50 transition-colors"
        >
          <LayoutDashboard className="h-5 w-5 text-blue-500 animate-pulse" />
          <span className="tracking-wide bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">NextOps Studio</span>
        </Link>

        <div className="p-4 border-b border-gray-800/40 shrink-0">
          <div className="relative flex items-center bg-gray-950/80 border border-gray-800 rounded-lg px-2.5 py-1.5 focus-within:border-blue-500/50 transition-colors">
            <Search className="h-3.5 w-3.5 text-gray-500 mr-2" />
            <input 
              type="text"
              placeholder="Шукати модуль..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-white placeholder-gray-600 outline-none w-full font-mono"
            />
            {searchQuery && (
              <X className="h-3 w-3 text-gray-500 cursor-pointer hover:text-white" onClick={() => setSearchQuery('')} />
            )}
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 min-h-0 custom-scrollbar">
          <span className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2 select-none">
            Згенеровані модулі ({filteredLinks.length})
          </span>
          
          {filteredLinks.map((link) => {
            const isActive = pathname === link.href;
            const IconComponent = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.35)] font-semibold scale-[1.02]' 
                    : 'hover:bg-gray-800/70 hover:text-white'
                }`}
              >
                <IconComponent className={`h-4 w-4 transition-colors ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-white'}`} />
                <span className="font-mono text-xs">{link.name}</span>
              </Link>
            );
          })}

          {filteredLinks.length === 0 && (
            <div className="text-center text-xs text-gray-600 font-mono py-4">Нічого не знайдено</div>
          )}
        </nav>

        <div className="p-4 border-t border-gray-800 bg-gray-950/60 mt-auto shrink-0 space-y-3">
          <div className="relative overflow-hidden p-[1px] rounded-xl bg-gray-800">
            <div className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 bg-[conic-gradient(from_0deg,transparent_40%,#8b5cf6_70%,#f43f5e_100%)] animate-[spin_4s_linear_infinite]" />
            <button
              onClick={() => { setIsPostmanOpen(true); setIsMobileOpen(false); }}
              className="relative w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white font-mono text-xs font-bold rounded-[11px] transition hover:bg-gray-900/90"
            >
              <Terminal className="h-4 w-4 text-violet-400 animate-pulse" />
              <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">WEBHOOK ORCHESTRATOR</span>
            </button>
          </div>

          <div className="relative overflow-hidden p-[1px] rounded-xl bg-gray-800">
            <div className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 bg-[conic-gradient(from_0deg,transparent_40%,#d97706_70%,#eab308_100%)] animate-[spin_5s_linear_infinite]" />
            <button
              onClick={() => { setIsTerminalOpen(true); setIsMobileOpen(false); }}
              className="relative w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white font-mono text-xs font-bold rounded-[11px] transition hover:bg-gray-900/90"
            >
              <Database className="h-4 w-4 text-amber-400" />
              <span className="bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">MONGO_ATLAS_CONSOLE</span>
            </button>
          </div>
        </div>
      </aside>

      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-10 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
