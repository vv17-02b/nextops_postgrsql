// C:\Users\Admin\Documents\my-unified-work-space\lib\servers\FinOpsController.ts

import { prisma } from "@/lib/prisma";

export interface SystemMetrics {
    totalBudget: number;
    averageCheck: number;
    activeProjects: number;
    totalProjects: number;
}

export interface OwnerKPI {
    totalRevenue: number;
    mrr: number;
    activeProUsers: number;
    totalUsersCount: number;
    systemTokenBurn: number;
}

export class FinOpsController {
    /**
     * Крок 3.1: Агрегує NoSQL-метрики для конкретного інженера Хабу
     * @param userId Унікальний NoSQL ID розробника
     */
    static async getUserMetrics(userId: string): Promise<SystemMetrics> {
        if (!userId || !/^[0-9a-fA-F]{24}$/.test(userId)) {
            return { totalBudget: 0, averageCheck: 0, activeProjects: 0, totalProjects: 0 };
        }

        try {
            // Паралельне виконання агрегацій у MongoDB Atlas для максимальної швидкості
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

            return {
                totalBudget: budgetAggregation._sum.budget || 0.0,
                averageCheck: budgetAggregation._avg.budget ? Math.round(budgetAggregation._avg.budget) : 0,
                activeProjects: activeCount,
                totalProjects: totalProjects
            };
        } catch (error: any) {
            console.error("🚨 [FinOpsController.getUserMetrics Crash]:", error.message);
            return { totalBudget: 0, averageCheck: 0, activeProjects: 0, totalProjects: 0 };
        }
    }
    /**
     * Крок 3.2: Агрегує живі комерційні KPI для Командного Центру Власника платформи
     */
    static async getOwnerKPI(): Promise<OwnerKPI> {
        try {
            // 1. Зчитуємо реальних користувачів з активною підпискою
            const paidUsers = await prisma.user.findMany({
                where: { subscriptionActive: true },
                select: { plan: true }
            });

            const totalUsersCount = await prisma.user.count();

            // 2. Розраховуємо реальний MRR на основі поточних бізнес-планів
            let mrr = 0;
            let activeProUsers = 0;

            paidUsers.forEach((user) => {
                if (user.plan === "ENTERPRISE") {
                    mrr += 49;
                    activeProUsers += 1;
                } else if (user.plan === "PRO") {
                    mrr += 99; // Або твій базовий тариф PRO
                    activeProUsers += 1;
                }
            });

            // Емулюємо загальний обіг (LTV) як MRR помножений на середній життєвий цикл (орієнтовно x3.5 для демо)
            const totalRevenue = mrr * 3.5;

            // 3. Підраховуємо реальну кількість запитів (спалених токенів ШІ) з історії логів
            const systemTokenBurn = await prisma.apiHistory.count({
                where: {
                    method: { in: ["POST", "POST_WEBHOOK", "ARTICLE"] }
                }
            });

            return {
                totalRevenue,
                mrr,
                activeProUsers,
                totalUsersCount,
                systemTokenBurn
            };
        } catch (error: any) {
            console.error("🚨 [FinOpsController.getOwnerKPI Crash]:", error.message);
            return { totalRevenue: 0, mrr: 0, activeProUsers: 0, totalUsersCount: 0, systemTokenBurn: 0 };
        }
    }
}
