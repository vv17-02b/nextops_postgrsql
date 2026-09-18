"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useAppStore } from "@/config/store";
import { ShieldAlert, Lock, RefreshCw } from "lucide-react";
import WorkspaceProject from "@/components/WorkspaceProject";
import WorkspacePostman from "@/components/WorkspacePostman";
import WorkspacePurePostman from "@/components/WorkspacePurePostman";
import WorkspaceDb from "@/components/WorkspaceDb";

type WindowId = "project" | "postman" | "purepostman" | "database" | null;

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const { setUpgradeModal } = useAppStore();
  const [activeWindow, setActiveWindow] = useState<WindowId>(null);

  if (status === "loading") {
    return (
      <div className="w-full h-screen bg-neutral-950 flex flex-col items-center justify-center font-mono gap-3 text-neutral-400">
        <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
        <span>SYNCHRONIZING_CORE_SESSION...</span>
      </div>
    );
  }

  const userRole = session?.user?.role || "DEVELOPER";
  const userPlan = session?.user?.plan || "FREE";

  const isAdmin = userRole === "ADMIN" || userPlan === "ENTERPRISE";
  const isProOrEnterprise = userPlan === "PRO" || userPlan === "ENTERPRISE" || isAdmin;

  const toggleWindow = (id: WindowId) => {
    if (id === "database" && !isAdmin) return;
    if ((id === "postman" || id === "purepostman") && !isProOrEnterprise) {
      setUpgradeModal(true);
      return;
    }

    if (activeWindow === id) setActiveWindow(null);
    else setActiveWindow(id);
  };
  const getWindowStyles = (id: WindowId) => {
    const baseStyle = `
      border border-white/5 bg-neutral-900/40 backdrop-blur-xl relative overflow-hidden rounded-2xl 
      transition-all duration-500 ease-in-out flex flex-col p-5 min-h-0
    `;

    if (activeWindow === null) {
      return `${baseStyle} h-[380px] lg:h-auto hover:scale-[1.012] hover:border-cyan-500/20 hover:bg-neutral-900/60 shadow-[0_20px_50px_rgba(0,0,0,0.6)] cursor-pointer`;
    }
    if (activeWindow === id) {
      return `${baseStyle} fixed inset-4 top-20 bottom-4 left-4 right-4 border-cyan-500/40 z-50 cursor-default bg-neutral-950/98 backdrop-blur-3xl shadow-[0_0_80px_rgba(0,0,0,0.9)]`;
    }
    return `${baseStyle} w-0 h-0 p-0 border-none opacity-0 pointer-events-none hidden`;
  };

  return (
    <div className="flex flex-col h-screen w-full p-4 sm:p-6 font-mono text-white bg-neutral-950 overflow-hidden relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293703_1px,transparent_1px),linear-gradient(to_bottom,#1f293703_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 pb-4 border-b border-neutral-900 relative z-20 select-none">
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full ${isAdmin ? "bg-amber-500 shadow-[0_0_15px_#f59e0b]" : "bg-cyan-500 shadow-[0_0_15px_#06b6d4]"} animate-pulse`} />
          <h1 className="text-sm sm:text-base font-black tracking-widest text-neutral-200 uppercase flex items-center gap-2">
            <span>NextOps Engine // Unified SaaS Hub v1.2</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-neutral-400">
              NODE_{userPlan}
            </span>
          </h1>
        </div>

        {activeWindow ? (
          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
            <span className="text-xs text-neutral-400 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-xl font-bold">
              FOCUS: <span className="text-cyan-400 font-black">{activeWindow.toUpperCase()}</span>
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setActiveWindow(null); }}
              className="px-4 py-2 text-xs bg-white text-black hover:bg-neutral-200 font-black rounded-xl transition-all cursor-pointer shadow-md uppercase tracking-wider"
            >
              [ ← ПОВЕРНУТИСЬ ДО 4 ВІКОН ]
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
            <div className="text-xs text-neutral-400 bg-neutral-900/50 px-4 py-2 rounded-xl border border-neutral-900 text-center sm:text-left flex items-center justify-center gap-1.5">
              СИСТЕМА: <span className="text-emerald-400 font-black">ONLINE</span>
              {isAdmin && <span className="text-amber-400 font-bold">// ROLE: ROOT_ADMIN</span>}
            </div>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest bg-gradient-to-r from-neutral-900 to-neutral-850 hover:from-neutral-800 hover:to-neutral-750 text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-700 rounded-xl transition-all duration-200 shadow-lg cursor-pointer"
            >
              <span className="text-blue-500 font-black">←</span>
              <span>RETURN_TO_CORE_DASHBOARD</span>
            </Link>
          </div>
        )}
      </header>
      <main className={`flex-1 w-full gap-4 transition-all duration-500 min-h-0 overflow-y-auto lg:overflow-hidden ${activeWindow === null ? "grid grid-cols-1 lg:grid-cols-2 lg:h-[calc(100vh-140px)] pb-4 lg:pb-0" : "relative"
        }`}>

        <div className={getWindowStyles("project")} onClick={() => activeWindow === null && toggleWindow("project")}>
          <div className="flex justify-between items-center mb-2.5 pb-1.5 border-b border-neutral-800/40 select-none">
            <span className="text-[11px] text-neutral-400 font-black tracking-wider">// ВІКНО №1 // AI AGENT MANAGER</span>
            {!activeWindow && <span className="text-[10px] text-cyan-400 font-bold animate-pulse">[ EXPAND ]</span>}
          </div>
          <div className="flex-1 min-h-0">
            <WorkspaceProject isOpen={activeWindow === "project"} onCloseAction={() => toggleWindow("project")} />
          </div>
        </div>

        <div className={getWindowStyles("postman")} onClick={() => activeWindow === null && toggleWindow("postman")}>
          {!isProOrEnterprise && (
            <div className="absolute inset-0 z-30 bg-neutral-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none">
              <Lock className="w-7 h-7 text-amber-500 mb-2" />
              <p className="text-xs font-black uppercase tracking-wider text-neutral-200">Модуль Вебхуків Заблоковано</p>
              <p className="text-[11px] text-neutral-500 mt-1 max-w-xs leading-relaxed">Для підключення індустріальних тригерів та зовнішніх CRM розширте тарифний ліміт</p>
              <button
                onClick={(e) => { e.stopPropagation(); setUpgradeModal(true); }}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:brightness-110 text-neutral-950 font-black text-[10px] uppercase tracking-wider rounded-xl transition shadow-lg cursor-pointer"
              >
                Оновити тариф до PRO
              </button>
            </div>
          )}
          <div className="flex justify-between items-center mb-2.5 pb-1.5 border-b border-neutral-800/40 select-none">
            <span className="text-[11px] text-neutral-400 font-black tracking-wider">// ВІКНО №2 // WEBHOOK ORCHESTRATOR</span>
            {!activeWindow && <span className="text-[10px] text-violet-400 font-bold animate-pulse">[ EXPAND ]</span>}
          </div>
          <div className={`flex-1 min-h-0 ${!isProOrEnterprise ? "blur-[2px] pointer-events-none" : ""}`}>
            <WorkspacePostman isOpen={activeWindow === "postman"} onCloseAction={() => toggleWindow("postman")} />
          </div>
        </div>

        <div className={getWindowStyles("purepostman")} onClick={() => activeWindow === null && toggleWindow("purepostman")}>
          {!isProOrEnterprise && (
            <div className="absolute inset-0 z-30 bg-neutral-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none">
              <Lock className="w-7 h-7 text-amber-500 mb-2" />
              <p className="text-xs font-black uppercase tracking-wider text-neutral-200">Sandbox Тестувальник Заблоковано</p>
              <p className="text-[11px] text-neutral-500 mt-1 max-w-xs leading-relaxed">Прямі POST/GET HTTP трансляції логів ядра вимагають активації комерційного ключа</p>
            </div>
          )}
          <div className="flex justify-between items-center mb-2.5 pb-1.5 border-b border-neutral-800/40 select-none">
            <span className="text-[11px] text-neutral-400 font-black tracking-wider">// ВІКНО №3 // PURE HTTP POSTMAN</span>
            {!activeWindow && <span className="text-[10px] text-emerald-400 font-bold animate-pulse">[ EXPAND ]</span>}
          </div>
          <div className={`flex-1 min-h-0 ${!isProOrEnterprise ? "blur-[2px] pointer-events-none" : ""}`}>
            <WorkspacePurePostman isOpen={activeWindow === "purepostman"} onCloseAction={() => toggleWindow("purepostman")} />
          </div>
        </div>

        <div className={getWindowStyles("database")} onClick={() => activeWindow === null && toggleWindow("database")}>
          {!isAdmin && (
            <div className="absolute inset-0 z-30 bg-neutral-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none">
              <ShieldAlert className="w-7 h-7 text-purple-500 mb-2 animate-pulse" />
              <p className="text-xs font-black uppercase tracking-wider text-neutral-200">Вузол Інфраструктури Заблоковано</p>
              <p className="text-[11px] text-neutral-500 mt-1.5 max-w-xs leading-relaxed">
                Доступ до NoSQL-терміналу `db.stats()` та фінансових KPI дозволено виключно легальному Власнику платформи за доменом
              </p>
            </div>
          )}
          <div className="flex justify-between items-center mb-2.5 pb-1.5 border-b border-neutral-800/40 select-none">
            <span className="text-[11px] text-neutral-400 font-black tracking-wider">// ВІКНО №4 // MONGO REAL-TIME FINOPS</span>
            {!activeWindow && <span className="text-[10px] text-amber-500 font-bold animate-pulse">[ EXPAND ]</span>}
          </div>
          <div className={`flex-1 min-h-0 ${!isAdmin ? "blur-[3px] pointer-events-none" : ""}`}>
            <WorkspaceDb isOpen={activeWindow === "database"} onCloseAction={() => toggleWindow("database")} />
          </div>
        </div>

      </main>
    </div>
  );
}
