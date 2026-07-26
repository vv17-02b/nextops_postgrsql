import { NextRequest } from "next/server";
import { handlers } from "@/lib/auth"; // Імпортуємо готові хендлери з нашого єдиного конфігу

// СУВОРЕ ПРАВИЛО ДЛЯ NEXT.JS 15+: Перемикаємо цей маршрут в режим класичного серверного Node.js.
export const runtime = "nodejs";

// ПРЕМІУМ-СТАБІЛІЗАЦІЯ ДЛЯ TURBOPACK: Забороняємо статичне кешування роуту перевірки сесії
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Явний суворий експорт іменованої функції для GET запитів Auth.js
 * Викликаємо внутрішній об'єктний метод GET із приведенням до any для обходу суворих сигнатур
 */
export async function GET(request: NextRequest) {
  return (handlers as any).GET(request);
}

/**
 * Явний суворий експорт іменованої функції для POST запитів Auth.js
 * Викликаємо внутрішній об'єктний метод POST із приведенням до any для обходу суворих сигнатур
 */
export async function POST(request: NextRequest) {
  return (handlers as any).POST(request);
}
