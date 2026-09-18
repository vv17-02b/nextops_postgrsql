"use client";

import React from "react";
import { useAppStore } from "@/config/store";
import { PLATFORM_CONTACTS } from "@/constant/conatant";
import { Mail, Phone, Clock, MapPin } from "lucide-react";

export default function Footer() {
  const { locale, t } = useAppStore();

  return (
    <footer className="w-full border-t border-neutral-900 bg-neutral-950/40 pt-12 pb-6 px-6 sm:px-8 select-none relative z-10 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col space-y-10">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          <div className="md:col-span-4 flex flex-col space-y-4">
            <div className="flex items-center gap-3 group select-none">
              <span className="font-black text-lg tracking-widest text-white uppercase font-mono">
                NEXT<span className="text-blue-500">OPS</span> // ENGINE
              </span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-sm">
              {t.hero.description}
            </p>
          </div>

          <div className="md:col-span-4 flex flex-col space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono">
              {locale === "ua" ? "Зв'язок з Хабом" : "Hub Connections"}
            </h4>
            <div className="flex flex-col space-y-2 text-xs text-neutral-500">
              <a href={`mailto:${PLATFORM_CONTACTS.supportEmail}`} className="flex items-center gap-2 hover:text-white transition">
                <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" /> {PLATFORM_CONTACTS.supportEmail}
              </a>
              <a href={`tel:${PLATFORM_CONTACTS.phone}`} className="flex items-center gap-2 hover:text-white transition">
                <Phone className="w-3.5 h-3.5 text-blue-500 shrink-0" /> {PLATFORM_CONTACTS.phone}
              </a>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span>{locale === "ua" ? PLATFORM_CONTACTS.address.ua : PLATFORM_CONTACTS.address.en}</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-4 flex flex-col space-y-4">
            <div className="flex flex-col space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono">
                {locale === "ua" ? "Техпідтримка" : "Support Hours"}
              </h4>
              <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
                <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>{locale === "ua" ? PLATFORM_CONTACTS.workingHours.ua : PLATFORM_CONTACTS.workingHours.en}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <a 
                href={PLATFORM_CONTACTS.githubRepo} 
                target="_blank" 
                rel="noreferrer" 
                className="p-2.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl text-neutral-400 hover:text-white transition cursor-pointer flex items-center justify-center"
                title="GitHub Repository"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://w3.org">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
              </a>

              <a 
                href={PLATFORM_CONTACTS.telegramChannel} 
                target="_blank" 
                rel="noreferrer" 
                className="p-2.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl text-neutral-400 hover:text-blue-400 transition cursor-pointer flex items-center justify-center"
                title="Telegram Channel"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://w3.org">
                  <path d="M23.91 3.79L20.3 20.84c-.27 1.21-.98 1.5-2 .94l-5.5-4.07-2.66 2.57c-.3.3-.55.55-1.12.55l.4-5.59 10.18-9.19c.44-.39-.1-.61-.69-.21L6.37 13.54l-5.42-1.7c-1.18-.37-1.2-1.18.25-1.75L22.42 1.48c1-.37 1.87.23 1.49 2.31z"/>
                </svg>
              </a>

              <a 
                href={PLATFORM_CONTACTS.youtubeX} 
                target="_blank" 
                rel="noreferrer" 
                className="p-2.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl text-neutral-400 hover:text-white transition cursor-pointer flex items-center justify-center"
                title="X Platform"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://w3.org">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>

        </div>

        <div className="border-t border-neutral-900/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-500 font-medium font-mono select-none">
          <div>
            &copy; {new Date().getFullYear()} <span className="text-neutral-400 font-bold">{PLATFORM_CONTACTS.companyName}</span>. All rights reserved.
          </div>
          <div className="flex items-center gap-2 text-[10px] text-neutral-600 bg-neutral-900/40 px-3 py-1 rounded-xl border border-neutral-900">
            <span>CORE: Next.js 15 // Auth.js v5 // MongoDB Atlas // Prisma 6</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
