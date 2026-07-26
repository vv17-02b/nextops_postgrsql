"use client";

import React from "react";

export default function PlatformPreview() {
  return (
    <div className="w-full rounded-2xl border border-white/5 bg-neutral-900/20 backdrop-blur-xl p-2 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden select-none relative max-w-7xl mx-auto">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
      
      <div className="w-full h-[250px] sm:h-[400px] lg:h-[480px] relative overflow-hidden rounded-xl bg-neutral-950">
        <img
          src="/images/hero_admin.png" /* 🔥 ВИПРАВЛЕНО: шлях до нової картинки PNG */
          alt="NextOps Workspace Platform Developer View"
          className="w-full h-full object-cover object-center opacity-80 hover:opacity-95 transition-opacity duration-700"
          loading="eager"
        />
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-neutral-950 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}

