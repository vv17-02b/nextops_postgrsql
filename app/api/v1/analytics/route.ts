import { NextResponse } from "next/server";
import { auth } from "@/lib/auth"; 
import { FinOpsController } from "@/lib/servers/FinOpsController";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Регулярний вираз для перевірки валідності MongoDB ObjectId
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

export async function GET(): Promise<Response> {
  try {
    // 1. Серверний захист сесії через Auth.js v5
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id.trim();

    // 2. ЗАХИСТ ВІД КРАШУ БД: Валідація ObjectId
    if (!OBJECT_ID_REGEX.test(userId)) {
      return NextResponse.json({ 
        success: false, 
        error: "Некоректний формат ідентифікатора користувача для аналітики" 
      }, { status: 400 });
    }

    // 3. Делегування розрахунків єдиному центру бізнес-логіки (FinOpsController)
    // Це автоматично захищає від дублювання коду та усуває Race Condition
    const metrics = await FinOpsController.getUserMetrics(userId);

    // 4. Повертаємо метрики, які ідеально збігаються з очікуваннями WorkspaceContext.tsx
    return NextResponse.json({
      success: true,
      metrics: {
        totalBudget: metrics.totalBudget,
        averageCheck: metrics.averageCheck,
        activeProjects: metrics.activeProjects,
        totalProjects: metrics.totalProjects
      }
    }, { status: 200 });

  } catch (error: unknown) {
    const err = error as Error;
    console.error(" 🚨 [ ANALYTICS_ROUTE_CRASH ]:", err.message);
    return NextResponse.json({ 
      success: false, 
      error: "Помилка сервера при розрахунку аналітики" 
    }, { status: 500 });
  }
}
