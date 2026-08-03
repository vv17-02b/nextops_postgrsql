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

// Строгий інтерфейс для користувачів з активною підпискою
interface PaidUserItem {
  plan: "FREE" | "PRO" | "ENTERPRISE";
}

export class FinOpsController {
  /**
   * Крок 3.1: Агрегує NoSQL-метрики для конкретного інженера Хабу
   * @param userId Унікальний NoSQL ID розробника
   */
  static async getUserMetrics(userId: string): Promise<SystemMetrics> {
    if (!userId || !/^[0-9a-fA-F]{24}$/.test(userId)) {
      return {
        totalBudget: 0,
        averageCheck: 0,
        activeProjects: 0,
        totalProjects: 0,
      };
    }

    try {
      // Приводимо модель до розширеного типу, щоб Mock-база не сварилася на NoSQL-агрегації
      const projectModel = prisma.project as unknown as {
        aggregate: (args: {
          where: { userId: string };
          _sum: { budget: boolean };
          _avg: { budget: boolean };
        }) => Promise<{
          _sum: { budget: number | null };
          _avg: { budget: number | null };
        }>;
        count: (args?: {
          where?: { userId: string; status?: string };
        }) => Promise<number>;
      };

      // Паралельне виконання агрегацій у MongoDB Atlas для максимальної швидкості
      const [budgetAggregation, activeCount, totalProjects] = await Promise.all(
        [
          projectModel.aggregate({
            where: { userId },
            _sum: { budget: true },
            _avg: { budget: true },
          }),
          projectModel.count({
            where: { userId, status: "ACTIVE" },
          }),
          projectModel.count({
            where: { userId },
          }),
        ],
      );

      return {
        totalBudget: budgetAggregation._sum?.budget || 0.0,
        averageCheck: budgetAggregation._avg?.budget
          ? Math.round(budgetAggregation._avg.budget)
          : 0,
        activeProjects: activeCount,
        totalProjects: totalProjects,
      };
    } catch (error: unknown) {
      const err = error as Error;
      console.error("🚨 [FinOpsController.getUserMetrics Crash]:", err.message);
      return {
        totalBudget: 0,
        averageCheck: 0,
        activeProjects: 0,
        totalProjects: 0,
      };
    }
  }

  /**
   * Крок 3.2: Агрегує живі комерційні KPI для Командного Центру Власника платформи
   */
  static async getOwnerKPI(): Promise<OwnerKPI> {
    try {
      // Розширюємо тип користувача для підтримки методу count()
      const userModel = prisma.user as unknown as {
        findMany: (args: {
          where: { subscriptionActive: boolean };
          select: { plan: boolean };
        }) => Promise<PaidUserItem[]>;
        count: () => Promise<number>;
      };

      // 1. Зчитуємо реальних користувачів з активною підпискою
      const paidUsers = await userModel.findMany({
        where: { subscriptionActive: true },
        select: { plan: true },
      });

      const totalUsersCount = await userModel.count();

      // 2. Розраховуємо реальний MRR на основі поточних бізнес-планів
      let mrr = 0;
      let activeProUsers = 0;

      // Знищено 'any' — тепер ітерація працює на базі строгого PaidUserItem
      paidUsers.forEach((user: PaidUserItem) => {
        if (user.plan === "ENTERPRISE") {
          mrr += 499; // Enterprise тариф у доларах
          activeProUsers += 1;
        } else if (user.plan === "PRO") {
          mrr += 99; // Твій базовий тариф PRO
          activeProUsers += 1;
        }
      });

      // Емулюємо загальний обіг (LTV) як MRR помножений на середній життєвий цикл (орієнтовно x3.5 для демо)
      const totalRevenue = mrr * 3.5;

      // Розширюємо тип apiHistory для підтримки лічильника логів
      const apiHistoryModel = prisma.apiHistory as unknown as {
        count: (args: {
          where: { method: { in: string[] } };
        }) => Promise<number>;
      };

      // 3. Підраховуємо реальну кількість запитів (спалених токенів ШІ) з історії логів
      const systemTokenBurn = await apiHistoryModel.count({
        where: {
          method: {
            in: [
              "POST",
              "PUT",
              "DELETE",
              "POST_WEBHOOK",
              "ARTICLE",
              "FEEDBACK",
            ],
          },
        },
      });

      return {
        totalRevenue,
        mrr,
        activeProUsers,
        totalUsersCount,
        systemTokenBurn,
      };
    } catch (error: unknown) {
      const err = error as Error;
      console.error(" [FinOpsController.getOwnerKPI Crash]:", err.message);
      return {
        totalRevenue: 0,
        mrr: 0,
        activeProUsers: 0,
        totalUsersCount: 0,
        systemTokenBurn: 0,
      };
    }
  }
}
