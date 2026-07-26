import React from "react";
// Використовуємо прямий відносний шлях для гарантованого проходження валідації типів
import { auth } from "@/lib/auth";

import { redirect } from "next/navigation";

interface NextOpsLayoutProps {
  children: React.ReactNode;
}

export default async function NextOpsLayout({ children }: NextOpsLayoutProps) {
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  return (
    <div className="w-full h-screen overflow-hidden bg-neutral-950 text-white">
      {children}
    </div>
  );
}
