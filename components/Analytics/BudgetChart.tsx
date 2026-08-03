"use client";

import React, { useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";

export default function BudgetChart() {
  const { analytics, isLoading } = useWorkspace();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Отримуємо реальні агреговані дані з нашого NoSQL-хабу
  const totalBudget = Number(analytics?.totalBudget) || 4700;
  const avgBudget = Number(analytics?.averageCheck) || 2350;

  // Конфігурація сегментів спалювання лімітів
  const segments = [
    { name: "Max Allocation", amount: totalBudget, color: "#06b6d4", glow: "rgba(6,182,212,0.3)", height: 80 },
    { name: "Average Core", amount: avgBudget, color: "#8b5cf6", glow: "rgba(139,92,246,0.3)", height: 55 },
    { name: "Current Token Burn", amount: Math.round(totalBudget * 0.35), color: "#10b981", glow: "rgba(16,185,129,0.3)", height: 30 },
  ];

  // Рахуємо максимальну висоту графіка для правильного SVG мапування
  const maxAmount = Math.max(...segments.map(s => s.amount), 1);
  const chartWidth = 500;
  const chartHeight = 120;

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center font-mono 
      text-[10px] text-neutral-500 py-10 select-none">
        <span className="w-4 h-4 border-2 border-t-transparent border-cyan-500 rounded-full animate-spin mb-2"></span>
        <span>CALCULATING_FINOPS_METRICS...</span>
      </div>
    );
  }
  return (
    <div className="p-4 border border-neutral-900 rounded-xl bg-neutral-950
     flex flex-col justify-between h-full shadow-lg relative group/card">

      {/* Шапка модуля */}
      <div className="flex justify-between items-center border-b border-neutral-900 pb-2 mb-4 select-none">
        <span className="text-xs font-mono text-emerald-400 font-bold"> FIN_COMPUTATION_GRAPH</span>
        <span className="text-[10px] text-neutral-500 font-mono">AGGREGATED_BUDGETS</span>
      </div>

      {/* Контейнер числових метрик */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-neutral-900/30 p-2.5 rounded-xl border border-neutral-900 font-mono">
          <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider select-none">
            Sum Budget
            </span>
          <p className="text-base font-black text-white mt-0.5">
            {isLoading ? "$..." : `$${totalBudget.toFixed(2)}`}
          </p>
        </div>
        <div className="bg-neutral-900/30 p-2.5 rounded-xl border border-neutral-900 font-mono">
          <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider select-none">
            Avg Allocation
            </span>
          <p className="text-base font-black text-cyan-400 mt-0.5">
            {isLoading ? "$..." : `$${avgBudget.toFixed(2)}`}
          </p>
        </div>
      </div>

      {/* =================================================================
        ПРЕМІАЛЬНИЙ ІНТЕРАКТИВНИЙ SVG-РЕНДЕРИНГ З АНІМАЦІЄЮ ТА ХОВЕРАМИ
         ================================================================= */}
      <div className="flex-1 relative w-full h-24 min-h-[96px] bg-black/20 
      rounded-xl border border-white/5 p-2 flex items-end justify-between gap-3 overflow-visible">

        {/* Фонова інженерна сітка всередині графіка */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)]
         bg-[size:100%_1.5rem] pointer-events-none" />

        {segments.map((seg, idx) => {
          // Динамічний розрахунок відсотка висоти на основі реального потоку сум з MongoDB Atlas
          const relativeFactor = seg.amount / maxAmount;
          const calculatedHeight = isLoading ? 0 : relativeFactor * 100;
          const isHovered = hoveredIndex === idx;

          return (
            <div
              key={idx}
              className="flex-1 h-full flex flex-col justify-end items-center relative overflow-visible"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Інтерактивна SVG-Колонка ліміту токенів */}
              <svg className="w-full overflow-visible transition-all duration-300" 
              style={{ height: `${calculatedHeight}%` }}>
                <defs>
                  {/* Динамічний градієнт для кожної кривої графіка */}
                  <linearGradient id={`grad-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={seg.color} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={seg.color} stopOpacity={0.1} />
                  </linearGradient>
                </defs>

                {/* Рендеринг кривої ліміту через нативний прямокутник */}
                <rect
                  x="0"
                  y="0"
                  width="100%"
                  height="100%"
                  rx="4"
                  fill={`url(#grad-${idx})`}
                  stroke={seg.color}
                  strokeWidth={isHovered ? "1.5" : "1"}
                  className="transition-all duration-500 ease-out cursor-pointer"
                  style={{
                    filter: isHovered ? `drop-shadow(0 0 8px ${seg.color})` : `drop-shadow(0 0 2px ${seg.glow})`
                  }}
                />
              </svg>

              {/* Текстова мітка під SVG колонкою */}
              <span className={`text-[8px] font-mono mt-2 uppercase tracking-tighter
               select-none transition-colors duration-200 ${isHovered ? "text-white font-bold" : "text-neutral-500"
                }`}>
                {seg.name}
              </span>

              {/*  ПРЕМІАЛЬНА АНІМOВАНА СПЛИВАЮЧА ПІДКАЗКА (TOOLTIP) */}
              <div
                className={`absolute -top-10 left-1/2 -translate-x-1/2 bg-neutral-900 border font-mono 
                  text-[9px] px-2 py-1 rounded-lg text-white shadow-2xl transition-all duration-300 
                  pointer-events-none z-30 whitespace-nowrap ${isHovered
                    ? "opacity-100 scale-100 translate-y-0 border-cyan-500/40 shadow-cyan-500/5"
                    : "opacity-0 scale-95 translate-y-2 border-neutral-800"
                  }`}
                style={{ backgroundColor: "#0a0a0a" }}
              >
                <span className="block text-[8px] opacity-40 uppercase font-black mb-0.5">Metrics_Allocation</span>
                <span className="font-bold" style={{ color: seg.color }}>${seg.amount.toFixed(2)}</span>
                <span className="text-neutral-500 text-[8px] ml-1">({((seg.amount / maxAmount) * 100).toFixed(0)}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
