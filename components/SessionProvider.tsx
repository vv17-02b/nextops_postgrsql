"use client";

import React from "react";
import { SessionProvider as AuthProvider } from "next-auth/react";

interface SessionProviderProps {
  children: React.ReactNode;
}

// Клиентская обертка NextAuth для раздачи данных сессии по всему дереву компонентов
export default function SessionProvider({ children }: SessionProviderProps) {
  return <AuthProvider>{children}</AuthProvider>;
}
