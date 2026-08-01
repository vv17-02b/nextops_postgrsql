import { NextRequest } from "next/server";
import { handlers } from "@/lib/auth"; // Імпортуємо готові хендлери з нашого єдиного конфігу

// СУВОРЕ ПРАВИЛО ДЛЯ NEXT.JS 15+: Перемикаємо цей маршрут в режим класичного серверного Node.js.
export const runtime = "nodejs";

// ПРЕМІУМ-СТАБІЛІЗАЦІЯ ДЛЯ TURBOPACK: Забороняємо статичне кешування роуту перевірки сесії
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Окремий строгий тип для хендлера Auth.js, щоб назавжди забути про брудний 'any'
type AuthHandlerFn = (req: Request) => Promise<Response>;

/**
 * Явний суворий експорт іменованої функції для GET запитів Auth.js
 * Використовуємо безпечне приведення типу функції для повної сумісності з Next.js 15
 */
export async function GET(request: NextRequest): Promise<Response> {
  const getHandler = handlers.GET as AuthHandlerFn;
  return getHandler(request);
}

/**
 * Явний суворий експорт іменованої функції для POST запитів Auth.js
 * Використовуємо безпечне приведення типу функції для повної сумісності з Next.js 15
 */
export async function POST(request: NextRequest): Promise<Response> {
  const postHandler = handlers.POST as AuthHandlerFn;
  return postHandler(request);
}
