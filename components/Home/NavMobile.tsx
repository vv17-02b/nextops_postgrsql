"use client";

import React from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useAppStore } from "@/config/store";
import {
  Terminal,
  LayoutGrid,
  CreditCard,
  LogOut,
  LogIn,
  MessageSquare,
  BookOpen,
  PenTool,
  FileText
} from "lucide-react";

interface NavMobileProps {
  isOpen: boolean;
  onCloseAction: () => void;
  handleNavClickAction: (
    type: "pricing" | "reviews" | "blog" | "write_article" | "write_review"
  ) => void;
}

export default function NavMobile({
  isOpen,
  onCloseAction,
  handleNavClickAction,
}: NavMobileProps) {
  const { data: session } = useSession();
  const { locale, t, setAuthModal, setUpgradeModal } = useAppStore();

  if (!isOpen) return null;

  return (
    <div className="md:hidden fixed inset-x-0 top-16 bg-neutral-950/95 backdrop-blur-2xl border-b border-white/10 shadow-2xl z-40 animate-in slide-in-from-top-2 duration-200">
      <div className="p-4 space-y-4 font-mono text-xs">
        
        {/* АВТОРИЗОВАНИЙ КОРИСТУВАЧ: Робочі простори та тариф */}
        {session ? (
          <div className="space-y-2 pb-3 border-b border-white/5">
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/workspace"
                onClick={onCloseAction}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-neutral-900 border border-white/5 hover:border-emerald-500/30 text-emerald-400 rounded-xl font-black uppercase tracking-wider transition"
              >
                <Terminal className="w-4 h-4" />
                <span>Sandbox</span>
              </Link>
              
              <Link
                href="/admin"
                onClick={onCloseAction}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-neutral-900 border border-white/5 hover:border-cyan-500/30 text-cyan-400 rounded-xl font-black uppercase tracking-wider transition"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Workspace</span>
              </Link>
            </div>

            <button
              onClick={() => {
                onCloseAction();
                setUpgradeModal(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl font-black uppercase tracking-wider transition active:scale-[0.98]"
            >
              <CreditCard className="w-4 h-4" />
              <span>Upgrade Plan</span>
            </button>
          </div>
        ) : null}

        {/* ОСНОВНА НАВІГАЦІЯ */}
        <div className="space-y-1">
          <button
            onClick={() => handleNavClickAction("pricing")}
            className="w-full flex items-center justify-between px-3 py-2.5 text-neutral-300 hover:text-white hover:bg-white/5 rounded-xl transition font-bold uppercase"
          >
            <span>{locale === "ua" ? "Тарифи" : "Pricing"}</span>
          </button>

          <button
            onClick={() => handleNavClickAction("reviews")}
            className="w-full flex items-center justify-between px-3 py-2.5 text-neutral-300 hover:text-white hover:bg-white/5 rounded-xl transition font-bold uppercase"
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              {locale === "ua" ? "Відгуки" : "Reviews"}
            </span>
          </button>

          <button
            onClick={() => handleNavClickAction("blog")}
            className="w-full flex items-center justify-between px-3 py-2.5 text-neutral-300 hover:text-white hover:bg-white/5 rounded-xl transition font-bold uppercase"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-violet-500" />
              {locale === "ua" ? "Статті" : "Articles"}
            </span>
          </button>

          <Link
            href="/docs"
            onClick={onCloseAction}
            className="w-full flex items-center justify-between px-3 py-2.5 text-neutral-300 hover:text-white hover:bg-white/5 rounded-xl transition font-bold uppercase"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              Docs
            </span>
          </Link>
        </div>

        {/* КНОПКИ СТВОРЕННЯ КОНТЕНТУ (ДЛЯ АВТОРИЗОВАНИХ) */}
        {session && (
          <div className="pt-2 border-t border-white/5 space-y-1">
            <button
              onClick={() => handleNavClickAction("write_review")}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition font-bold uppercase"
            >
              <PenTool className="w-4 h-4" />
              <span>{locale === "ua" ? "+ Написати відгук" : "+ Write Review"}</span>
            </button>

            <button
              onClick={() => handleNavClickAction("write_article")}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-fuchsia-400 hover:bg-fuchsia-500/10 rounded-xl transition font-bold uppercase"
            >
              <BookOpen className="w-4 h-4" />
              <span>{locale === "ua" ? "+ Написати статтю" : "+ Write Article"}</span>
            </button>
          </div>
        )}

        {/* АВТОРИЗАЦІЯ / ВИХІД */}
        <div className="pt-3 border-t border-white/5">
          {session ? (
            <button
              onClick={() => {
                onCloseAction();
                signOut();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-bold uppercase tracking-wider transition active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4" />
              <span>{locale === "ua" ? "Вийти" : "Sign Out"}</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onCloseAction();
                setAuthModal(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:brightness-110 text-white rounded-xl font-black uppercase tracking-widest transition shadow-lg active:scale-[0.98]"
            >
              <LogIn className="w-4 h-4" />
              <span>{t.actions.login}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}