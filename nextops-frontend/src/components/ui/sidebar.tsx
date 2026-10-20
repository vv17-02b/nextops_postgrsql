"use client";
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Terminal, Menu, X, Database, Search,
  User, ShieldCheck, Key, FolderHeart, Cpu, BarChart3, 
  Layers, MessageSquare, ShieldAlert, ShoppingBag, 
  Coins, Box, Activity, Sliders
} from 'lucide-react';
import WorkspacePostman from '@/components/WorkspacePostman'; 
import WorkspaceDb from '@/components/WorkspaceDb'; 

// Прописуємо індивідуальні іконки для кожної колекції MongoDB
const links = [
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
  const [isPostmanOpen, setIsPostmanOpen] = useState<boolean>(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(false); 
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false); 

  // Фільтрація модулів на льоту
  const filteredLinks = useMemo(() => {
    return links.filter(link => link.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  return (
    <>
      {/* Мобільна кнопка бургер-меню */}
      <button 
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-30 p-2 bg-gray-900 text-white rounded-lg 
        shadow-md border border-gray-800"
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Сайдбар */}
      <aside className={`w-64 bg-gray-900 text-gray-400 flex flex-col h-screen fixed left-0 
      top-0 border-r border-gray-800 z-20 font-sans shadow-[6px_0_30px_rgba(0,0,0,0.4)] 
      transition-transform duration-300 md:translate-x-0 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Шапка сайдбару з переходом на головну сторінку */}
        <Link 
          href="/" 
          onClick={() => setIsMobileOpen(false)}
          className="p-5 border-b border-gray-800 flex items-center gap-3 text-white font-bold h-16 shrink-0 select-none hover:bg-gray-800/50 transition-colors"
        >
          <LayoutDashboard className="h-5 w-5 text-blue-500 animate-pulse" />
          <span className="tracking-wide bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">NextOps Studio</span>
        </Link>

        {/* ЖИВИЙ ПОШУК МОДУЛІВ */}
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
        
        {/* НАВІГАЦІЯ зі змінними іконками та скролом */}
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
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
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

        {/* ФІКС ПАНЕЛЬ: Преміальні кнопки з ефектом обертання неонового контуру */}
        <div className="p-4 border-t border-gray-800 bg-gray-950/60 mt-auto shrink-0 space-y-3">
          
          {/* Анімована кнопка Оркестратора */}
          <div className="relative overflow-hidden p-[1px] rounded-xl bg-gray-800">
            {/* Градієнтна лінія, що крутиться на фоні */}
            <div className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 bg-[conic-gradient(from_0deg,transparent_40%,#8b5cf6_70%,#f43f5e_100%)] animate-[spin_4s_linear_infinite]" />
            <button
              onClick={() => { setIsPostmanOpen(true); setIsMobileOpen(false); }}
              className="relative w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white font-mono text-xs font-bold rounded-[11px] transition hover:bg-gray-900/90"
            >
              <Terminal className="h-4 w-4 text-violet-400 animate-pulse" />
              <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">WEBHOOK ORCHESTRATOR</span>
            </button>
          </div>

          {/* Анімована кнопка Терміналу */}
          <div className="relative overflow-hidden p-[1px] rounded-xl bg-gray-800">
            {/* Градієнтна лінія, що крутиться на фоні */}
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

      {/* Мобільна темна плашка при відкритому меню */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-10 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/*  МОДАЛКА ОРКЕСТРАТОРА (POSTMAN) */}
      {isPostmanOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-opacity duration-300"
          onClick={() => setIsPostmanOpen(false)}
        >
          <div 
            className="w-full max-w-2xl bg-neutral-950 rounded-2xl border border-neutral-800 shadow-[0_0_50px_rgba(139,92,246,0.2)] transform transition-all flex flex-col my-auto"
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()} 
          >
            <WorkspacePostman isOpen={isPostmanOpen} onCloseAction={() => setIsPostmanOpen(false)} />
          </div>
        </div>
      )}

      {/*  ПРЕМІАЛЬНА МОДАЛКА НO-SQL ТЕРМІНАЛА */}
      {isTerminalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-opacity duration-300"
          onClick={() => setIsTerminalOpen(false)}
        >
          <div 
            className="w-full max-w-2xl h-[480px] rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.15)] transform transition-all flex flex-col my-auto"
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()} 
          >
            <WorkspaceDb isOpen={isTerminalOpen} onCloseAction={() => setIsTerminalOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
