"use client";

import React from "react";
import { useWorkspace } from "@/context/WorkspaceContext";

export default function BudgetChart() {
  const { analytics, isLoading } = useWorkspace();

  // Гарантуємо, що значення завжди будуть числами, уникаючи вразливості undefined.toFixed()
  const totalBudget = Number(analytics?.sum_budget) || 0;
  const avgBudget = Number(analytics?.avg_budget) || 0;

  // Рахуємо відносні показники для візуального графіка лімітів
  const segments = [
    { name: "Max Alloc", factor: 1.0, color: "from-cyan-500 to-cyan-400" },
    { name: "Avg Core", factor: 0.65, color: "from-violet-600 to-violet-500" },
    { name: "Current Burn", factor: 0.35, color: "from-emerald-500 to-emerald-400" },
  ];

  return (
    <div className="p-4 border border-slate-900 rounded-xl bg-slate-950 flex flex-col justify-between h-full shadow-lg">
      <div className="flex justify-between items-center border-b border-slate-900 pb-2 mb-4 select-none">
        <span className="text-xs font-mono text-emerald-400 font-bold">📈 FIN_COMPUTATION_GRAPH</span>
        <span className="text-[10px] text-slate-500 font-mono">AGGREGATED_BUDGETS</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-900/30 p-2.5 rounded border border-slate-900 font-mono">
          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider select-none">Sum Budget</span>
          <p className="text-base font-black text-white mt-0.5">
            {isLoading ? "$..." : `$${totalBudget.toFixed(2)}`}
          </p>
        </div>
        <div className="bg-slate-900/30 p-2.5 rounded border border-slate-900 font-mono">
          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider select-none">Avg Allocation</span>
          <p className="text-base font-black text-cyan-400 mt-0.5">
            {isLoading ? "$..." : `$${avgBudget.toFixed(2)}`}
          </p>
        </div>
      </div>

      <div className="flex items-end justify-between gap-4 px-4 pt-2 h-20">
        {segments.map((seg, idx) => {
          const calculatedHeight = seg.factor * 100;
          const displayValue = totalBudget * seg.factor;

          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
              <div
                className={`w-full relative rounded-t bg-gradient-to-t ${seg.color} transition-all duration-500 ease-out shadow-[0_0_15px_rgba(16,185,129,0.1)]`}
                style={{ height: isLoading ? "0%" : `${calculatedHeight}%` }}
              >
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition font-mono text-white shadow-xl whitespace-nowrap z-10 select-none">
                  ${displayValue.toFixed(1)}
                </div>
              </div>
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-tight select-none">{seg.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
