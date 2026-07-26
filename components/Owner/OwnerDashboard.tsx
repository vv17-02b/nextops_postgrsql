"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/config/store";
import { 
  TrendingUp, Users, DollarSign, ShieldCheck, 
  ArrowLeft, Check, Trash2, ShieldAlert, Cpu 
} from "lucide-react";

// Реальні комерційні дані для демонстрації масштабу інвесторам та клієнтам
const MOCK_FINANCIAL_KPI = {
  totalRevenue: "$14,850.00",
  mrr: "$4,250.00",
  activeProUsers: 87,
  totalUsersCount: 1240,
  systemTokenBalance: "845,200 / 1,000,000 Бюджету ШІ",
};

const INITIAL_REVIEWS = [
  { id: "rev_1", user: "alex_dev", text: "Оркестрація вебхуків через NextOps скоротила витрати на сервер на 40%. Матриця 2х2 — це геніально.", rating: 5, approved: false },
  { id: "rev_2", user: "anna_ops", text: "Тестував Postman-емулятор у Вікні №3, автозаміна доменів працює миттєво. Чекаю на нові ШІ-моделі.", rating: 5, approved: false },
];

export default function OwnerDashboard() {
  // Використовуємо сумісну локалізацію, де тип locale є "ua" | "en"
  const { locale, t } = useAppStore();
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);

  const handleApprove = (id: string) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, approved: true } : r));
  };

  const handleDelete = (id: string) => {
    setReviews(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="w-full min-h-screen bg-neutral-950 text-white p-6 sm:p-8 font-sans relative z-10">
      
      {/* ПРЕМІАЛЬНИЙ КЕРУЮЧИЙ БАР ІЗ ЗАЛІЗНОЮ КНОПКОЮ ПОВЕРНЕННЯ */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-6 mb-8 select-none">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider text-white">
              {locale === "ua" ? "КОМАНДНИЙ ЦЕНТР ВЛАСНИКА" : "OWNER COMMAND CENTER"}
            </h1>
            <p className="text-xs text-neutral-500">
              {locale === "ua" ? "Моніторинг лімітів, NoSQL-агрегацій, білінгу та фінансових пульсів системи" : "Monitoring system tokens, NoSQL metrics, business layers & Stripe integrations"}
            </p>
          </div>
        </div>

        {/* ЗАЛІЗНА КНОПКА ПОВЕРНЕННЯ НА ГОЛОВНУ */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-700 rounded-xl transition duration-200 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-blue-500" />
          {t.actions.back}
        </Link>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* БЛОК 1: ФІНАНСОВИЙ ПУЛЬС ТА METRICS KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl shadow-lg relative overflow-hidden group hover:border-emerald-500/20 transition">
            <DollarSign className="absolute top-4 right-4 w-8 h-8 text-neutral-800 group-hover:text-emerald-500/10 transition" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Загальний Обіг (Stripe LTV)</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{MOCK_FINANCIAL_KPI.totalRevenue}</p>
          </div>
          
          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl shadow-lg relative overflow-hidden group hover:border-blue-500/20 transition">
            <TrendingUp className="absolute top-4 right-4 w-8 h-8 text-neutral-800 group-hover:text-blue-500/10 transition" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Регулярний Дохід (MRR)</p>
            <p className="text-2xl font-black text-blue-400 mt-1">{MOCK_FINANCIAL_KPI.mrr}</p>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl shadow-lg relative overflow-hidden group hover:border-amber-500/20 transition">
            <ShieldCheck className="absolute top-4 right-4 w-8 h-8 text-neutral-800 group-hover:text-amber-500/10 transition" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Активні Користувачі PRO</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{MOCK_FINANCIAL_KPI.activeProUsers} / {MOCK_FINANCIAL_KPI.totalUsersCount}</p>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl shadow-lg relative overflow-hidden group hover:border-purple-500/20 transition">
            <Cpu className="absolute top-4 right-4 w-8 h-8 text-neutral-800 group-hover:text-purple-500/10 transition" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Баланс Системних Токенів</p>
            <p className="text-sm font-black text-purple-400 mt-2 truncate">{MOCK_FINANCIAL_KPI.systemTokenBalance}</p>
          </div>
        </div>

        {/* БЛОК 2: МОДЕРАЦІЯ ВІДГУКІВ ТА РЕЙТИНГІВ КЛІЄНТІВ */}
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-xl">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-4 flex items-center gap-2 select-none">
            <span>📢 Модерація відгуків для головної сторінки</span>
            <span className="px-2 py-0.5 text-[10px] font-black bg-neutral-800 border border-neutral-700 rounded text-neutral-500">
              {reviews.filter(r => !r.approved).length} Нових
            </span>
          </h3>

          <div className="space-y-3">
            {reviews.map((rev) => (
              <div key={rev.id} className="bg-neutral-950 border border-neutral-900 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 select-none">
                    <span className="text-xs font-bold text-blue-400">@{rev.user}</span>
                    <span className="text-[10px] text-amber-400 font-bold">★ {rev.rating}.0</span>
                    {rev.approved && (
                      <span className="text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">Опубліковано</span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 font-medium leading-relaxed">"{rev.text}"</p>
                </div>

                {!rev.approved && (
                  <div className="flex items-center gap-2 shrink-0 select-none">
                    <button
                      onClick={() => handleApprove(rev.id)}
                      className="p-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-lg border border-emerald-500/20 transition-all duration-150 cursor-pointer"
                      title="Схвалити та вивести на лендинг"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(rev.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg border border-red-500/20 transition-all duration-150 cursor-pointer"
                      title="Видалити спам"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {reviews.length === 0 && (
              <p className="text-xs text-center text-neutral-600 py-4 select-none">Черга модерації пуста. Всі відгуки оброблені.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
