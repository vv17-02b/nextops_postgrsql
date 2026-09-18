"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Folder, Terminal, Menu, X, Database } from 'lucide-react';
import WorkspacePostman from '@/components/WorkspacePostman'; 
import WorkspaceDb from '@/components/WorkspaceDb'; // 🌟 Імпортуємо наш NoSQL термінал

const links = [
    { name: 'Account', href: '/account' },
    { name: 'AgentKnowledgeBase', href: '/agentknowledgebase' },
    { name: 'ApiHistory', href: '/apihistory' },
    { name: 'Category', href: '/category' },
    { name: 'Order', href: '/order' },
    { name: 'OrderItem', href: '/orderitem' },
    { name: 'Product', href: '/product' },
    { name: 'Project', href: '/project' },
    { name: 'Review', href: '/review' },
    { name: 'Session', href: '/session' },
    { name: 'User', href: '/user' },
    { name: 'UserAiBudget', href: '/useraibudget' },
    { name: 'VerificationToken', href: '/verificationtoken' },
    { name: 'Warehouse', href: '/warehouse' },
    { name: 'WebhookConfig', href: '/webhookconfig' }
];

export default function Sidebar(): React.JSX.Element {
  const pathname = usePathname();
  const [isPostmanOpen, setIsPostmanOpen] = useState<boolean>(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(false); // 🌟 Стейт відкриття консолі
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false); 

  return (
    <>
      {/* Мобільна кнопка бургер-меню */}
      <button 
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-30 p-2 bg-gray-900 text-white rounded-lg shadow-md border border-gray-800"
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Сайдбар */}
      <aside className={`w-64 bg-gray-900 text-gray-400 flex flex-col h-screen fixed left-0 top-0 border-r border-gray-800 z-20 font-sans shadow-[6px_0_30px_rgba(0,0,0,0.4)] transition-transform duration-300 md:translate-x-0 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-5 border-b border-gray-800 flex items-center gap-3 text-white font-bold h-16 select-none">
          <LayoutDashboard className="h-5 w-5 text-blue-500" />
          <span>NextOps Studio</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 pb-32">
          <span className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2 select-none">
            Згенеровані модулі
          </span>
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.35)] font-semibold' 
                    : 'hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Folder className={`h-4 w-4 transition-colors ${isActive ? 'text-white' : 'text-gray-500'}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* 🌟 ФІКС ПАНЕЛІ КНОПОК: Дві елітні Low-Code консолі тепер разом! */}
        <div className="p-4 border-t border-gray-800 bg-gray-950/60 sticky bottom-0 left-0 right-0 space-y-2">
          {/* Фіолетова кнопка Постмана */}
          <button
            onClick={() => { setIsPostmanOpen(true); setIsMobileOpen(false); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-mono text-xs font-bold rounded-xl transition hover:brightness-110 shadow-lg shadow-violet-500/15 cursor-pointer"
          >
            <Terminal className="h-4 w-4 animate-pulse" />
            <span>WEBHOOK ORCHESTRATOR</span>
          </button>

          {/* Бурштинова кнопка нашого NoSQL Терміналу */}
          <button
            onClick={() => { setIsTerminalOpen(true); setIsMobileOpen(false); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-mono text-xs font-bold rounded-xl transition hover:brightness-110 shadow-lg shadow-amber-500/15 cursor-pointer"
          >
            <Database className="h-4 w-4" />
            <span>MONGO_ATLAS_CONSOLE</span>
          </button>
        </div>
      </aside>

      {/* Мобільна темна плашка при відкритому меню */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-10 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* 🔮 МОДАЛКА ОРКЕСТРАТОРА (POSTMAN) */}
      {isPostmanOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-opacity duration-300"
          onClick={() => setIsPostmanOpen(false)}
        >
          <div 
            className="w-full max-w-2xl bg-neutral-950 rounded-2xl border border-neutral-800 shadow-[0_0_50px_rgba(139,92,246,0.2)] transform transition-transform duration-300 scale-100 flex flex-col my-auto"
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()} 
          >
            <WorkspacePostman 
              isOpen={isPostmanOpen} 
              onCloseAction={() => setIsPostmanOpen(false)} 
            />
          </div>
        </div>
      )}

      {/* 🌟 🔮 ПРЕМІАЛЬНА МОДАЛКА НO-SQL ТЕРМІНАЛА (WORKSPACE DB) */}
      {isTerminalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-opacity duration-300"
          onClick={() => setIsTerminalOpen(false)}
        >
          <div 
            className="w-full max-w-2xl h-[480px] rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.15)] transform transition-transform duration-300 scale-100 flex flex-col my-auto"
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()} 
          >
            <WorkspaceDb 
              isOpen={isTerminalOpen} 
              onCloseAction={() => setIsTerminalOpen(false)} 
            />
          </div>
        </div>
      )}
    </>
  );
}
