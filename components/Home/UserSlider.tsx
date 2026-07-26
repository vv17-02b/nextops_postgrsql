"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface StreamUser {
  id: string;
  name: string;
  role: string;
  plan: "FREE" | "PRO" | "ENTERPRISE";
  image?: string | null;
}

export default function UserSlider() {
  const [users, setUsers] = useState<StreamUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStreamUsers = async () => {
      try {
        const res = await fetch("/api/v1/users");
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
        }
      } catch (err) {
        console.error("Не вдалося завантажити підписників для слайдера:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStreamUsers();
  }, []);

  const displayUsers = users.length > 0 ? users : [
    { id: "fallback_core", name: "vlad_engine", role: "SaaS Core Architect", plan: "PRO" as const, image: null }
  ];

  const duplicatedUsers = [...displayUsers, ...displayUsers, ...displayUsers, ...displayUsers];

  if (isLoading) {
    return (
      <div className="relative w-full h-[300px] sm:h-[400px] bg-neutral-900/20 border border-neutral-900 rounded-2xl flex items-center justify-center font-mono text-xs text-neutral-500">
        <span className="w-4 h-4 border-2 border-t-transparent border-blue-500 rounded-full animate-spin mr-2"></span>
        <span>SYNCHRONIZING_CYBER_STREAM...</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[300px] sm:h-[400px] bg-neutral-900/20 backdrop-blur-xl border border-white/5 rounded-2xl p-4 overflow-hidden shadow-[20px_20px_50px_rgba(0,0,0,0.8)] select-none">
      <div className="absolute top-0 left-0 w-full h-14 bg-gradient-to-b from-neutral-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-14 bg-gradient-to-t from-neutral-950 to-transparent z-10 pointer-events-none" />

      <motion.div 
        className="flex flex-col gap-3"
        animate={{ y: [0, -450] }}
        transition={{
          ease: "linear",
          duration: displayUsers.length * 4.5,
          repeat: Infinity
        }}
      >
        {duplicatedUsers.map((user, idx) => {
          const isCoreUser = user.name ? user.name.toLowerCase().includes("vlad") : false;
          
          let avatarSrc = null;
          if (isCoreUser) {
            avatarSrc = "/images/avatar.jpg";
          } else if (user.image) {
            avatarSrc = user.image;
          }

          return (
            <div 
              key={`${user.id}-${idx}`}
              className="flex items-center gap-3 bg-neutral-900/40 border border-neutral-800/60 p-3.5 rounded-xl hover:border-blue-500/20 transition-all duration-300 text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-950 to-neutral-900 border border-neutral-800 flex items-center justify-center text-xs font-black uppercase text-blue-500 shrink-0 font-mono overflow-hidden">
                {avatarSrc ? (
                  <img 
                    src={avatarSrc} 
                    alt={user.name} 
                    className="w-full h-full object-cover object-center brightness-95" 
                  />
                ) : (
                  (user.name || "US").substring(0, 2)
                )}
              </div>
              
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-black text-neutral-200 font-mono truncate">@{user.name || "anonymous"}</span>
                <span className="text-[10px] text-neutral-500 font-sans mt-0.5 truncate">{user.role || "Platform Engineer"}</span>
              </div>

              <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-md border shrink-0 font-mono ${
                user.plan === "PRO" || user.plan === "ENTERPRISE"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]" 
                  : "bg-neutral-950 text-neutral-500 border-neutral-850"
              }`}>
                {user.plan}
              </span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
