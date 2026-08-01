"use client";

import { useState } from "react"; 
import Link from "next/link"; // Обов'язковий імпорт для кнопки повернення
import WorkspaceProject from "@/components/WorkspaceProject";
import WorkspacePostman from "@/components/WorkspacePostman";
import WorkspacePurePostman from "@/components/WorkspacePurePostman";
import WorkspaceDb from "@/components/WorkspaceDb";

type WindowId = "project" | "postman" | "purepostman" | "database" | null;

export default function AdminDashboard() {
  const [activeWindow, setActiveWindow] = useState<WindowId>(null);

  const toggleWindow = (id: WindowId) => {
    if (activeWindow === id) setActiveWindow(null);
    else setActiveWindow(id);
  };

  const getWindowStyles = (id: WindowId) => {
    // Оновлені преміальні стилі ультра-скла без конфліктів для 4-х вікон
    const baseStyle = `
      border border-white/5 bg-neutral-900/40 backdrop-blur-xl relative overflow-hidden rounded-2xl 
      transition-all duration-500 ease-in-out flex flex-col p-5 cursor-pointer
    `;
    
    if (activeWindow === null) {
      return `${baseStyle} h-[380px] lg:h-auto hover:scale-[1.015] hover:border-cyan-500/30 hover:bg-neutral-900/60 shadow-[0_20px_50px_rgba(0,0,0,0.6)]`;
    }
    if (activeWindow === id) {
      return `${baseStyle} fixed inset-6 top-20 bottom-6 left-6 right-6 border-cyan-500/50 z-50 cursor-default bg-neutral-950/95 backdrop-blur-2xl shadow-[0_0_80px_rgba(0,0,0,0.8)]`;
    }
    return `${baseStyle} w-0 h-0 p-0 border-none opacity-0 pointer-events-none hidden`;
  };

  return (
    // Змінено колір фону на глибокуenterprise-матрицю bg-neutral-950
    <div className="flex flex-col h-screen w-full p-4 sm:p-6 font-mono text-white bg-neutral-950 overflow-hidden relative">
      
      {/* Індустріальна фонова підкладка для посилення глибини скла */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293703_1px,transparent_1px),linear-gradient(to_bottom,#1f293703_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* ==========================================
          ВЕРХНЯ ПАНЕЛЬ КЕРУВАННЯ ТА СТАТУСУ
         ========================================== */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 pb-4 border-b border-neutral-900 relative z-20 select-none">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_15px_#06b6d4] animate-pulse"></span>
          <h1 className="text-sm sm:text-base font-black tracking-widest text-neutral-200 uppercase">
            NextOps Engine // Unified SaaS Hub v1.2
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
            {/* Текстовий індикатор статусу системи */}
            <div className="text-xs text-neutral-400 bg-neutral-900/50 px-4 py-2 rounded-xl border border-neutral-900 text-center sm:text-left flex items-center justify-center gap-1.5">
              СИСТЕМА: <span className="text-emerald-400 font-black">ONLINE</span> // CLUSTER: MONGO_ATLAS
            </div>

            {/* 🔥 НАША НОВА ПРЕМІАЛЬНА КНОПКА ПОВЕРНЕННЯ НА ГОЛОВНУ */}
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

      {/* ==========================================
          ОСНОВНА РОБОЧА ЗОНА 4-ВІКОНННОЇ СІТКИ (2х2)
         ========================================== */}
      <main className={`flex-1 w-full gap-4 transition-all duration-500 min-h-0 overflow-y-auto lg:overflow-hidden ${
        activeWindow === null ? "grid grid-cols-1 lg:grid-cols-2 lg:h-[calc(100vh-140px)] pb-4 lg:pb-0" : "relative"
      }`}>
        
        {/* ВІКНО №1: LIVE PREVIEW (ШІ МЕНЕДЖЕР) */}
        <div 
          className={getWindowStyles("project")} 
          onClick={() => activeWindow === null && toggleWindow("project")}
        >
          <div className="flex justify-between items-center mb-2.5 pb-1.5 border-b border-neutral-800/40 select-none">
            <span className="text-[11px] text-neutral-400 font-black tracking-wider">// ВІКНО №1 // AI AGENT MANAGER</span>
            {!activeWindow && <span className="text-[10px] text-cyan-400 font-bold animate-pulse">[ EXPAND ]</span>}
          </div>
          <div className="flex-1 min-h-0">
            <WorkspaceProject isOpen={activeWindow === "project"} onCloseAction={() => toggleWindow("project")} />
          </div>
        </div>

        {/* ВІКНО №2: API WORKBENCH (ZAPIER ШЛЮЗ) */}
        <div 
          className={getWindowStyles("postman")} 
          onClick={() => activeWindow === null && toggleWindow("postman")}
        >
          <div className="flex justify-between items-center mb-2.5 pb-1.5 border-b border-neutral-800/40 select-none">
            <span className="text-[11px] text-neutral-400 font-black tracking-wider">// ВІКНО №2 // WEBHOOK ORCHESTRATOR</span>
            {!activeWindow && <span className="text-[10px] text-violet-400 font-bold animate-pulse">[ EXPAND ]</span>}
          </div>
          <div className="flex-1 min-h-0">
            <WorkspacePostman isOpen={activeWindow === "postman"} onCloseAction={() => toggleWindow("postman")} />
          </div>
        </div>

        {/* ВІКНО №3: NEW API SANDBOX (ТВІЙ РІДНИЙ ЧИСТИЙ POSTMAN) */}
        <div 
          className={getWindowStyles("purepostman")} 
          onClick={() => activeWindow === null && toggleWindow("purepostman")}
        >
          <div className="flex justify-between items-center mb-2.5 pb-1.5 border-b border-neutral-800/40 select-none">
            <span className="text-[11px] text-neutral-400 font-black tracking-wider">// ВІКНО №3 // PURE HTTP POSTMAN</span>
            {!activeWindow && <span className="text-[10px] text-emerald-400 font-bold animate-pulse">[ EXPAND ]</span>}
          </div>
          <div className="flex-1 min-h-0">
            <WorkspacePurePostman isOpen={activeWindow === "purepostman"} onCloseAction={() => toggleWindow("purepostman")} />
          </div>
        </div>

        {/* ВІКНО №4: FINOPS MONITOR (АНАЛІТИКА ТА ГРАФІК) */}
        <div 
          className={getWindowStyles("database")} 
          onClick={() => activeWindow === null && toggleWindow("database")}
        >
          <div className="flex justify-between items-center mb-2.5 pb-1.5 border-b border-neutral-800/40 select-none">
            <span className="text-[11px] text-neutral-400 font-black tracking-wider">// ВІКНО №4 // MONGO REAL-TIME FINOPS</span>
            {!activeWindow && <span className="text-[10px] text-amber-500 font-bold animate-pulse">[ EXPAND ]</span>}
          </div>
          <div className="flex-1 min-h-0">
            <WorkspaceDb isOpen={activeWindow === "database"} onCloseAction={() => toggleWindow("database")} />
          </div>
        </div>

      </main>
    </div>
  );
}
