"use client";

import React from "react";
import { useAppStore } from "@/config/store";
import { Check, ShieldCheck, X } from "lucide-react";
import CreditCardForm from "@/components/Billing/CreditCardForm";

// Перейменовано проп на onCloseAction для сумісності з Next.js 15+
interface UpgradePlanModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
}

export default function UpgradePlanModal({ isOpen, onCloseAction }: UpgradePlanModalProps) {
  const { locale } = useAppStore();

  if (!isOpen) return null;

  return (
    <div 
      onClick={onCloseAction}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-neutral-950 border border-neutral-900 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto font-sans text-white"
      >
        {/* Кнопка закриття модального вікна */}
        <button 
          onClick={onCloseAction}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Заголовок модалки */}
        <div className="mb-6 select-none">
          <h2 className="text-lg font-black uppercase tracking-wider text-blue-500">
            {locale === "ua" ? "АКТИВАЦІЯ SAAS ПОТУЖНОСТІ" : "UPGRADE TO HIGH PERFORMANCE"}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            {locale === "ua" ? "Перехід на безлімітні ліміти та NoSQL фінансову аналітику" : "Unlock ultimate cloud limits, multi-route tokens & advanced graphs"}
          </p>
        </div>

        {/* Картка переваг тарифу PRO */}
        <div className="space-y-4">
          <div className="p-4 bg-neutral-900/40 border border-neutral-900 rounded-xl flex flex-col gap-3">
            <div className="flex justify-between items-baseline select-none">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                {locale === "ua" ? "ENTERPRISE ПЕРЕВАГИ" : "ENTERPRISE BENEFITS"}
              </span>
              <div className="text-right">
                <span className="text-xl font-black text-white">$49</span>
                <span className="text-[10px] text-neutral-500 font-medium">/{locale === "ua" ? "міс" : "mo"}</span>
              </div>
            </div>

            {/* Безлімітні Enterprise-переваги */}
            <ul className="space-y-2.5 text-xs text-neutral-300 font-medium pt-2 select-none border-t border-neutral-950">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{locale === "ua" ? "Безлімітна кількість ШІ-агентів" : "Unlimited AI agent instance documents"}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{locale === "ua" ? "Advanced Zapier-автоматизація вебхуків" : "Advanced multi-route webhook gateways"}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{locale === "ua" ? "Повна фінансова NoSQL-агрегація" : "Deep NoSQL financial analytics & charts"}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{locale === "ua" ? "Пріоритетна підтримка власника 24/7" : "24/7 priority support with owner bypass"}</span>
              </li>
            </ul>
          </div>

          {/* ВБУДОВАНА ІНТЕРАКТИВНА ФОРМА КАРТКИ ОПЛАТИ */}
          <div className="mt-4" onClick={(e) => e.stopPropagation()}>
            <CreditCardForm 
              planType="PRO" 
              price="$49" 
              onSuccess={(redirectUrl) => {
                window.location.href = redirectUrl;
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
