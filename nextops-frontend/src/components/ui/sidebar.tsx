"use client";
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Terminal, Menu, X, Database, Search,
  User, ShieldCheck, Key, FolderHeart, Cpu, BarChart3, 
  Layers, MessageSquare, ShieldAlert, ShoppingBag, 
  Coins, Box, Activity, Sliders, LucideIcon
} from 'lucide-react';
import WorkspacePostman from '@/components/WorkspacePostman'; 
import WorkspaceDb from '@/components/WorkspaceDb'; 

interface SidebarLink {
  name: string;
  href: string;
  icon: LucideIcon;
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
  const [isPostmanOpen, setIsPostmanOpen] = useState<boolean>(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(false); 
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false); 

  const filteredLinks = useMemo(() => {
    return links.filter((link: SidebarLink) => link.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  return (
    <>
      <button 
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-30 p-2 bg-slate-900 text-white rounded-lg shadow-md border border-slate-800"
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside className={`w-64 bg-slate-900 text-slate-400 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 z-20 font-sans shadow-2xl transition-transform duration-300 md:translate-x-0 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        <Link 
          href="/" 
          onClick={() => setIsMobileOpen(false)}
          className="p-5 border-b border-slate-800 flex items-center gap-3 text-white font-bold h-16 shrink-0 select-none hover:bg-slate-800/50 transition-colors"
        >
          <LayoutDashboard className="h-5 w-5 text-blue-500" />
          <span className="tracking-wide bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">NextOps Studio</span>
        </Link>

        <div className="p-4 border-b border-slate-800/40 shrink-0">
          <div className="relative flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 focus-within:border-blue-500/50 transition-colors">
            <Search className="h-3.5 w-3.5 text-slate-500 mr-2" />
            <input 
              type="text"
              placeholder="Шукати модуль..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-white placeholder-slate-600 outline-none w-full font-mono"
            />
            {searchQuery && (
              <X className="h-3 w-3 text-slate-500 cursor-pointer hover:text-white" onClick={() => setSearchQuery('')} />
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1 min-h-0 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2 select-none">
            Згенеровані модулі ({filteredLinks.length})
          </span>
          
          {filteredLinks.map((link: SidebarLink) => {
            const isActive = pathname === link.href;
            const IconComponent = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 font-semibold' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <IconComponent className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                <span className="font-mono text-xs">{link.name}</span>
              </Link>
            );
          })}

          {filteredLinks.length === 0 && (
            <div className="text-center text-xs text-slate-600 font-mono py-4">Нічого не знайдено</div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950/60 mt-auto shrink-0 space-y-3">
          
          <div className="group relative rounded-xl p-[1px] bg-slate-800 hover:bg-gradient-to-r hover:from-violet-500 hover:to-fuchsia-500 transition-all duration-300 shadow-md">
            <button
              onClick={() => { setIsPostmanOpen(true); setIsMobileOpen(false); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white font-mono text-xs font-bold rounded-[11px] transition group-hover:bg-slate-900/90"
            >
              <Terminal className="h-4 w-4 text-violet-400" />
              <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">WEBHOOK ORCHESTRATOR</span>
            </button>
          </div>

          <div className="group relative rounded-xl p-[1px] bg-slate-800 hover:bg-gradient-to-r hover:from-amber-500 hover:to-yellow-500 transition-all duration-300 shadow-md">
            <button
              onClick={() => { setIsTerminalOpen(true); setIsMobileOpen(false); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white font-mono text-xs font-bold rounded-[11px] transition group-hover:bg-slate-900/90"
            >
              <Database className="h-4 w-4 text-amber-400" />
              <span className="bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">MONGO_ATLAS_CONSOLE</span>
            </button>
          </div>

        </div>
      </aside>

      {/* Оверлеї та Модалки */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-10 md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {isPostmanOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsPostmanOpen(false)}>
          <div className="w-full max-w-2xl bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl flex flex-col my-auto" onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
            <WorkspacePostman isOpen={isPostmanOpen} onCloseAction={() => setIsPostmanOpen(false)} />
          </div>
        </div>
      )}

      {isTerminalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsTerminalOpen(false)}>
          <div className="w-full max-w-2xl h-[480px] bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl flex flex-col my-auto" onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
            <WorkspaceDb isOpen={isTerminalOpen} onCloseAction={() => setIsTerminalOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
