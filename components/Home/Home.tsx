"use client";

import React, { useState } from "react";
import { signIn, useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Home() {
  const { data: session, status } = useSession();
  const [inputEmail, setInputEmail] = useState("vladimir@workspace.com");
  const [inputName, setInputName] = useState("Vladimir");

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] text-center
     p-6 text-white bg-transparent font-mono">
      <div className="max-w-xl p-8 bg-black/85 border border-red-950/60 rounded-3xl
       backdrop-blur-md shadow-2xl w-full">
        
        <h1 className="text-2xl font-bold mb-2 tracking-tight uppercase text-neutral-200">
          NextOps // <span className="text-red-600">Unified Workspace</span>
        </h1>
        <p className="text-xs text-neutral-400 mb-6 leading-relaxed font-sans">
          Автономний тестовий стенд. Введіть будь-які дані нижче для емуляції запису в MongoDB Atlas.
        </p>

        {status === "loading" ? (
          <p className="text-xs font-mono text-neutral-500 animate-pulse">// ПЕРЕВІРКА СЕСІЇ СИСТЕМИ...</p>
        ) : !session ? (      
          /* ФОРМА ВВЕДЕННЯ ДАНИХ ДЛЯ КЛІЄНТА */
          <div className="flex flex-col gap-3 max-w-sm mx-auto text-left">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-neutral-500 font-mono
               uppercase tracking-wider">Тестовий Email:</label>
              <input 
                type="email" 
                value={inputEmail} 
                onChange={(e) => setInputEmail(e.target.value)}
                className="bg-neutral-950/80 border border-red-950/50 rounded-xl
                 px-4 py-2 text-xs text-white outline-none focus:border-red-800 font-mono"
                placeholder="Введіть email..."
              />
            </div>

            <div className="flex flex-col gap-1.5 mb-2">
              <label className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider">
                Ім'я користувача:
                </label>
              <input 
                type="text" 
                value={inputName} 
                onChange={(e) => setInputName(e.target.value)}
                className="bg-neutral-950/80 border border-red-950/50 rounded-xl
                 px-4 py-2 text-xs text-white outline-none focus:border-red-800 font-mono"
                placeholder="Введіть ім'я..."
              />
            </div>

            <button
              onClick={() => signIn("credentials", { 
                email: inputEmail, 
                name: inputName,
                callbackUrl: "/admin" 
              })}
              className="w-full py-2.5 bg-white hover:bg-neutral-200
               text-black font-bold rounded-xl text-xs transition-all 
               cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.05)] text-center select-none"
            >
              [ ЗАПИСАТИ В БАЗУ ТА УВІЙТИ ]
            </button>
          </div>
        ) : (        
          /* ПАНЕЛЬ АВТЕНТИФІКОВАНОГО СТАТУСУ */
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-black/60 border border-red-950/40 rounded-xl text-xs text-left font-mono break-all">
              <div className="text-neutral-500 uppercase tracking-widest text-[9px] mb-1">// СЕСІЯ АКТИВНА:</div>
              <div className="text-white font-bold mb-1">EMAIL: {session.user?.email}</div>
              <div className="text-white font-bold">NAME: {session.user?.name}</div>
              <div className="mt-2 text-[10px] text-red-400">
                ROLE: {(session.user as any).role || "DEVELOPER"}
              </div>
            </div>
            
            <div className="flex justify-center gap-3">
              <Link
                href="/admin"
                className="px-5 py-2.5 bg-red-950/60 hover:bg-red-900/40 border
                 border-red-800 text-white font-bold text-xs rounded-xl transition-all"
              >
                [ ПОВЕРНУТИСЬ В АДМІНКУ ]
              </Link>
              <button
                onClick={() => signOut()}
                className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 
                text-xs text-neutral-400 rounded-xl border border-neutral-800 transition-all cursor-pointer"
              >
                Вийти
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
