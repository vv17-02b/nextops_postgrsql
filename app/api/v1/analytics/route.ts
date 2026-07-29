// C:\Users\Admin\Documents\my-unified-work-space\app\api\v1\analytics\route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Твій нативний синглтон
import { auth } from "@/lib/auth"; // Твоя сесія

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Твоя залізна та перевірена NoSQL-агрегація через пул Promise.all
    const [budgetAggregation, activeCount, totalProjects] = await Promise.all([
      prisma.project.aggregate({
        where: { userId },
        _sum: { budget: true },
        _avg: { budget: true }
      }),
      prisma.project.count({
        where: { userId, status: "ACTIVE" }
      }),
      prisma.project.count({
        where: { userId }
      })
    ]);

    // Повертаємо масив метрик, адаптований під WorkspaceContext розробника
    return NextResponse.json({
      success: true,
      metrics: {
        totalBudget: budgetAggregation._sum.budget || 0.0,
        averageCheck: budgetAggregation._avg.budget ? Math.round(budgetAggregation._avg.budget) : 0,
        activeProjects: activeCount,
        totalProjects: totalProjects
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("📊 [ ANALYTICS_ROUTE_CRASH ]:", error);
    return NextResponse.json({ success: false, error: "Помилка сервера при розрахунку аналітики" }, { status: 500 });
  }
}
