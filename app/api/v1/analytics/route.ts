import { NextResponse } from "next/server";
import { auth } from "@/lib/auth"; 
import { prisma } from "@/lib/prisma"; // Пряме підключення оптимізованого клієнта

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

    // 3. ПРЯМИЙ ВИСОКОПРОДУКТИВНИЙ РОЗРАХУНОК МЕТРИК ЧЕРЕЗ PRISMA (Заміна FinOpsController)
    // Використовуємо Promise.all для паралельного виконання запитів у MongoDB Atlas
    const [activeProjectsCount, totalProjectsCount, budgetAggregation] = await Promise.all([
      // Лічильник активних проектів (використовує наш індекс @@index([userId, status]))
      prisma.project.count({
        where: { userId, status: "ACTIVE" }
      }),
      // Лічильник взагалі всіх проектів користувача
      prisma.project.count({
        where: { userId }
      }),
      // Агрегація суми бюджетів та середнього чеку
      prisma.project.aggregate({
        where: { userId },
        _sum: {
          budget: true
        },
        _avg: {
          budget: true
        }
      })
    ]);

    // Витягуємо чисті математичні значення з об'єкта агрегації
    const totalBudget = budgetAggregation._sum.budget || 0.0;
    const averageCheck = budgetAggregation._avg.budget ? Math.round(budgetAggregation._avg.budget * 100) / 100 : 0.0;

    // 4. Повертаємо метрики, які ідеально збігаються з очікуваннями WorkspaceContext.tsx
    return NextResponse.json({
      success: true,
      metrics: {
        totalBudget,
        averageCheck,
        activeProjects: activeProjectsCount,
        totalProjects: totalProjectsCount
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
