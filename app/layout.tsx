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

export const metadata: Metadata = {
  title: "NextOps // AI-Agent & Webhook Orchestrator",
  description: "Premium SaaS orchestration hub for AI agents, FinOps budget control, and low-code webhook automation.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${rubik.className} antialiased min-h-screen flex flex-col bg-neutral-950 text-white`}>
        <SessionProvider>
          <WorkspaceProvider>
            {children}
          </WorkspaceProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
