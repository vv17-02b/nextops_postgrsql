import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

import SessionProvider from "@/components/SessionProvider";
import { WorkspaceProvider } from "@/context/WorkspaceContext";

const rubik = localFont({
  src: [
    { path: "../public/fonts/Rubik-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/Rubik-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/Rubik-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/Rubik-Bold.woff2", weight: "700", style: "normal" },
    { path: "../public/fonts/Rubik-Black.woff2", weight: "900", style: "normal" },
  ],
  display: "swap", 
});

// КOМЕРЦІЙНИЙ СТАНДАРТ SEO МЕТАДАНИХ ДЛЯ ПЛАТФOРМИ NEXTOPS
export const metadata: Metadata = {
  // ФІКС 2026: Абсолютний базовий URL для валідації OpenGraph картинок у Next.js 15+
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://nextops.io"),
  
  title: {
    default: "NextOps // AI-Agent Hub & Webhook Orchestrator",
    template: "%s | NextOps Engine"
  },
  description: "Преміальна B2B SaaS екосистема для оркестрації ШІ-агентів, FinOps контролю бюджетів та low-code автоматизації вебхуків у реальному часі без витоку комерційних даних.",
  keywords: ["NextOps", "ШІ-агенти", "вебхуки шлюз", "FinOps", "MongoDB Atlas", "автоматизація бізнесу", "SaaS", "оркестрація нод", "Next.js 15"],
  authors: [{ name: "NextOps Core Team", url: "https://nextops.io" }],
  
  // Інтеграція OpenGraph для інтелектуального прев'ю сайту в месенджерах
  openGraph: {
    title: "NextOps Engine // Уніфікований пульт управління твоїм ШІ",
    description: "Контролюй ліміти та бюджети роботів, налаштовуй low-code автоматизацію за 30 секунд через Webhook-шлюзи.",
    url: "https://nextops.io",
    siteName: "NextOps",
    images: [
      {
        url: "/images/coding.jpg", // Використовуємо наявне фото з вашої структури папок
        width: 1200,
        height: 630,
        alt: "NextOps Cyber-Glass Dashboard Preview",
      },
    ],
    locale: "uk_UA",
    type: "website",
  },
  
  // Додаткові інструкції індексації для пошукових роботів Google
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body className={`${rubik.className} antialiased min-h-screen
       flex flex-col bg-neutral-950 text-white`}>
        <SessionProvider>
          <WorkspaceProvider>
            {children}
          </WorkspaceProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
