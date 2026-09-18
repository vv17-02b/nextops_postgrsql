import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

interface NextOpsLayoutProps {
  children: React.ReactNode;
}

export default async function NextOpsLayout({ children }: NextOpsLayoutProps) {
  const session = await auth();

  // 1. Повна ізоляція від анонімів
  if (!session || !session.user) {
    redirect("/");
  }

  // Роутинговий захист на рівні леяуту не потрібен для поділу ресурсів, 
  // оскільки ми пускаємо всіх (FREE та PRO), але обмежуємо модулі всередині сторінки.
  return (
    <div className="w-full h-screen overflow-hidden bg-neutral-950 text-white">
      {children}
    </div>
  );
}
