import React from "react";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface LandingLayoutProps {
  children: React.ReactNode;
}

export default function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col w-full bg-neutral-950
     text-white antialiased relative">
      <div className="absolute inset-0 
      bg-[linear-gradient(to_right,#1f293704_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)]
       bg-[size:4rem_4rem] pointer-events-none" />
      
      <main className="flex-1 flex flex-col w-full relative z-10 px-4 py-8">
        <div className="w-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
