"use client";

import React, { useState } from "react";
import { useAppStore } from "@/config/store";
import { Check, ShieldCheck, Sparkles, HelpCircle } from "lucide-react";

export default function TariffGrid() {
  const { t, setUpgradeModal } = useAppStore();
  const [showDetails, setShowDetails] = useState(false);

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-16 relative z-10 border-t border-neutral-900 bg-neutral-950/10">
      
      <div className="mb-10 text-left flex flex-col sm:flex-row sm:items-end justify-between gap-6 select-none">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-wider text-white font-mono">{t.pricing.title}</h2>
          <p className="text-sm text-neutral-500 mt-1.5 font-sans">{t.pricing.subtitle}</p>
        </div>
        
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="px-5 py-2.5 text-xs font-black font-mono uppercase tracking-widest bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 rounded-xl transition cursor-pointer flex items-center gap-2"
        >
          <HelpCircle className="w-4 h-4 text-blue-500" />
          <span>{t.actions.viewMore}</span>
        </button>
      </div>

      {/* Преміальна скляна картка тарифу PRO */}
      <div className="w-full max-w-3xl bg-neutral-900/30 backdrop-blur-xl border border-blue-500/20 p-8 rounded-3xl relative overflow-hidden shadow-2xl mx-auto group hover:border-blue-500/40 transition-all duration-300">
        <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full select-none">
          <Sparkles className="w-3 h-3 animate-spin [animation-duration:6s]" /> Core Performance Tier
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-black tracking-widest text-blue-400 uppercase font-mono">{t.pricing.tiers.name}</h3>
            <p className="text-xs text-neutral-400 mt-1.5 font-sans leading-relaxed">{t.pricing.tiers.description}</p>
          </div>
          
          <div className="flex items-baseline gap-1.5 pt-2 border-b border-neutral-950 pb-5 select-none">
            <span className="text-5xl font-black text-white font-mono">{t.pricing.tiers.price}</span>
            <span className="text-sm text-neutral-500 font-medium">/ {t.pricing.tiers.period}</span>
          </div>

          {/* Список переваг (Великий читабельний текст) */}
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-neutral-200 font-medium pt-3 select-none">
            {t.pricing.tiers.features.map((feat, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="font-sans font-medium">{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        {showDetails && (
          <div className="mt-6 pt-5 border-t border-neutral-950 text-xs text-neutral-400 bg-neutral-950/60 p-4 rounded-2xl animate-fadeIn leading-relaxed font-mono text-left">
            🔒 <span className="text-emerald-400 font-bold">Stripe Webhook Guard Active</span>: Автоматичний приймач оплат миттєво оновить NoSQL-документ вашого профілю на статус Plan: PRO відразу після успішної транзакції транзитного токена.
          </div>
        )}

        <button
          onClick={() => setUpgradeModal(true)}
          className="w-full mt-8 py-3.5 text-xs font-black uppercase tracking-widest bg-gradient-to-r from-blue-600 to-cyan-600 hover:brightness-110 text-white rounded-xl shadow-xl shadow-blue-500/5 border border-blue-500/20 transition-all cursor-pointer font-mono"
        >
          {t.pricing.tiers.actionText}
        </button>
      </div>

    </section>
  );
}
