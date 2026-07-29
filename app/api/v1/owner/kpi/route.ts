// C:\Users\Admin\Documents\my-unified-work-space\app\api\v1\owner\kpi\route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth"; // Твоя нативна система сесій NextAuth
import { FinOpsController } from "@/lib/servers/FinOpsController"; // Наш центральний аналітичний контролер

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. БЕЗПЕКА СЕСІЇ: Перевіряємо, чи користувач автентифікований
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized: Доступ заблоковано" }, { status: 401 });
    }

    // 2. ROLE GUARD (OWNER GUARD): Перевіряємо, чи має розробник права адміністратора
    const userRole = (session.user as any).role || "DEVELOPER";
    const userEmail = session.user.email || "";

    // Якщо роль не ADMIN і в email немає слова 'admin', примусово відсікаємо доступ
    if (userRole !== "ADMIN" && !userEmail.toLowerCase().includes("admin")) {
      return NextResponse.json({ 
        success: false, 
        error: "Forbidden: Цей шлюз доступний виключно власникам екосистеми NextOps" 
      }, { status: 403 });
    }

    // 3. ДЕЛЕГАЦІЯ КOМАНД: Викликаємо NoSQL-агрегацію контролера статистики
    const kpiData = await FinOpsController.getOwnerKPI();

    // 4. ВІДПOВІДЬ: Повертаємо живі комерційні метрики
    return NextResponse.json({
      success: true,
      kpi: kpiData
    }, { status: 200 });

  } catch (error: any) {
    console.error("🚨 [OWNER_KPI_ROUTE_CRASH]:", error.message);
    return NextResponse.json({ 
      success: false, 
      error: "Внутрішня помилка сервера при зборі корпоративної аналітики кластера" 
    }, { status: 500 });
  }
}
