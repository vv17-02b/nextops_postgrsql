"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useAppStore } from "@/config/store";
import { X, Mail, User, ShieldCheck, ArrowLeft, KeyRound } from "lucide-react";

export default function AuthModal() {
  const { isAuthModalOpen, setAuthModal, locale, t } = useAppStore();
  
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await signIn("credentials", {
        email,
        name: name || "Developer",
        callbackUrl: email.toLowerCase().includes("admin") ? "/owner" : "/admin",
      });
    } catch (err) {
      console.error("Помилка автентифікації сесії:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      
      <div 
        className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md transition-opacity duration-300"
        onClick={() => setAuthModal(false)}
      />

      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 p-6 sm:p-8 rounded-2xl shadow-[0_0_60px_rgba(59,130,246,0.15)] z-10 overflow-hidden transform scale-100 transition-all duration-300">
        
        <button 
          onClick={() => setAuthModal(false)}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-neutral-950/60 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 rounded-xl transition duration-150"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-blue-500" />
          {locale === "ua" ? "Назад" : "Back"}
        </button>

        <div className="text-center mt-4 mb-6 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-500">
            <KeyRound className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-black tracking-tight text-white uppercase">
            {t.actions.login}
          </h3>
          <p className="text-[11px] text-neutral-500 font-medium max-w-xs mx-auto">
            {locale === "ua" 
              ? "Миттєва автентифікація користувачів та синхронізація з NoSQL документами MongoDB Atlas" 
              : "Instant deployment of identity layers and active synchronization with MongoDB Atlas documents"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Конфлікт ліквідовано: Залишено лише flex-позиціонування */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2 mb-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-500" /> 
              {locale === "ua" ? "Email адреса розробника" : "Developer Email Address"}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., admin@nextops.io"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 font-mono transition"
              required
            />
          </div>

          {/* Конфлікт ліквідовано: Залишено лише flex-позиціонування */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2 mb-1.5">
              <User className="w-3.5 h-3.5 text-blue-500" /> 
              {locale === "ua" ? "Ваш системний нікнейм" : "Your System Nickname"}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., admin або alex_ops"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 font-mono transition"
            />
          </div>

          <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl flex items-start gap-2.5 text-[11px] text-neutral-500 leading-normal">
            <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
            <span>
              <strong className="text-neutral-400">Owner Guard:</strong>{" "}
              {locale === "ua" 
                ? "Якщо ваш email містить слово 'admin', система автоматично присвоїть статус ADMIN і відкриє повний фінансовий моніторинг без обмежень білінгу."
                : "Entering an email with 'admin' automatically triggers the ADMIN role bypass, activating uncapped limits and full FinOps monitoring."}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-xl font-black text-xs tracking-widest uppercase border border-blue-500/20 shadow-lg shadow-blue-600/10 transition-all duration-150"
          >
            {loading 
              ? (locale === "ua" ? "СИНХРОНІЗАЦІЯ ХАБУ..." : "SYNCING ORCHESTRATOR...") 
              : (locale === "ua" ? "УВІЙТИ В МАТРИЦЮ РОБОТИ" : "ENTER OPERATIONAL MATRIX")}
          </button>
        </form>

      </div>
    </div>
  );
}
