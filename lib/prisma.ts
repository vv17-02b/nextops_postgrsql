import {
  PrismaClient as OriginalPrismaClient,
  Plan,
  Prisma,
  User,
} from "@prisma/client";

// СТРОГІ ИНТЕРФЕЙСИ ДЛЯ СТАТЕЙ ТА ВІДГУКІВ В ПАМ'ЯТІ (Збережено для зворотньої сумісності)
interface MockDbItem {
  id: string;
  method: "ARTICLE" | "FEEDBACK";
  url: string;
  response: string;
  headers: string;
  status?: number;
  createdAt: Date;
}

interface UserDataPayload {
  email: string;
  name: string;
  role: string;
}

interface ApiHistoryCreatePayload {
  method: "ARTICLE" | "FEEDBACK";
  url: string;
  response: string;
  headers: string;
  status?: number;
}

// ГАРАНТОВАНІ СУВОРІ ПРОДАКШЕН-ТИПИ ДЛЯ ПРОЕКТІВ
interface MockProjectWhereInput {
  id?: string;
  userId?: string;
  status?: string;
}

interface MockProjectFindFirstArgs {
  where?: MockProjectWhereInput;
}

interface MockProjectCreateArgs {
  data: {
    name: string;
    budget: number;
    status: string;
  };
}

interface MockProjectAggregateArgs {
  where?: MockProjectWhereInput;
  _sum?: { budget: boolean };
  _avg?: { budget: boolean };
}

interface MockProjectCountArgs {
  where?: MockProjectWhereInput;
}

// Ініціалізація справжнього клієнта Prisma
const globalForPrisma = global as unknown as { prisma: OriginalPrismaClient };
const realPrisma =
  globalForPrisma.prisma ||
  new OriginalPrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = realPrisma;
}

// КЛАС-АДАПТЕР, ЯКИЙ НАПРАВЛЯЄ ВСІ ОПЕРАЦІЇ В РЕАЛЬНУ MONGODB ATLAS
class RealPrismaHub {
  constructor() {
    console.log(
      "▲ NextOps Engine v1.2: Запущено уніфікований NoSQL Хаб підключено до MongoDB Atlas ✅",
    );
  }

  user = {
    findMany: async (args?: Prisma.UserFindManyArgs): Promise<User[]> => {
      return await realPrisma.user.findMany(args);
    },
    findUnique: async (
      args: Prisma.UserFindUniqueArgs,
    ): Promise<User | null> => {
      return await realPrisma.user.findUnique(args);
    },
    findFirst: async (
      args?: Prisma.UserFindFirstArgs,
    ): Promise<User | null> => {
      return await realPrisma.user.findFirst(args);
    },
    create: async ({ data }: { data: UserDataPayload }): Promise<User> => {
      return await realPrisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          role: data.role,
          plan: Plan.FREE,
        },
      });
    },
    update: async (args: Prisma.UserUpdateArgs): Promise<User> => {
      const updatePayload: Prisma.UserUpdateInput = args.data;

      try {
        console.log(
          " [MongoDB Atlas]: Перехоплення мутації профілю адаптером...",
        );

        const targetId = args.where.id;
        const targetEmail = args.where.email;

        // Безпечний пошук користувача через чистий рядок, щоб обійти помилку BSON ObjectId
        if (targetId && typeof targetId === "string") {
          const dbUser: User | null = await realPrisma.user.findFirst({
            where: { OR: [{ id: targetId }, { name: targetId }] },
          });

          if (dbUser?.email) {
            return await realPrisma.user.update({
              where: { email: dbUser.email },
              data: updatePayload,
            });
          }
        }

        if (targetEmail) {
          return await realPrisma.user.update({
            where: { email: targetEmail },
            data: updatePayload,
          });
        }

        return await realPrisma.user.update(args);
      } catch (prismaErr: unknown) {
        const err = prismaErr as Error;
        console.error(
          " [ NextOps CRITICAL ERROR ]: MongoDB Atlas відхилила запис:",
          err.message,
        );
        throw err;
      }
    },
    delete: async (args: Prisma.UserDeleteArgs): Promise<User> => {
      console.log(
        " [MongoDB Atlas]: Видалення ноди користувача:",
        args.where.id || "unknown",
      );
      return await realPrisma.user.delete(args);
    },
  };
  apiHistory = {
    findMany: async (
      args?: Prisma.ApiHistoryFindManyArgs,
    ): Promise<import("@prisma/client").ApiHistory[]> => {
      return await realPrisma.apiHistory.findMany(args);
    },
    findUnique: async (
      args: Prisma.ApiHistoryFindUniqueArgs,
    ): Promise<import("@prisma/client").ApiHistory | null> => {
      return await realPrisma.apiHistory.findUnique(args);
    },
    create: async ({
      data,
    }: {
      data: ApiHistoryCreatePayload;
    }): Promise<import("@prisma/client").ApiHistory> => {
      return await realPrisma.apiHistory.create({
        data: {
          method: data.method,
          url: data.url,
          response: data.response ?? "",
          headers: data.headers ?? "",
          status: data.status || 200,
        },
      });
    },
    delete: async (
      args: Prisma.ApiHistoryDeleteArgs,
    ): Promise<import("@prisma/client").ApiHistory> => {
      return await realPrisma.apiHistory.delete(args);
    },
  };

  project = {
    findMany: async (
      args?: Prisma.ProjectFindManyArgs,
    ): Promise<import("@prisma/client").Project[]> => {
      return await realPrisma.project.findMany(args);
    },

    findFirst: async (
      args?: Prisma.ProjectFindFirstArgs,
    ): Promise<import("@prisma/client").Project | null> => {
      return await realPrisma.project.findFirst(args);
    },

    create: async (
      args: Prisma.ProjectCreateArgs,
    ): Promise<import("@prisma/client").Project> => {
      try {
        console.log(
          " [MongoDB Atlas]: Ініціалізація створення NoSQL ноди проєкту...",
        );
        return await realPrisma.project.create(args);
      } catch (prismaErr: unknown) {
        const err = prismaErr as Error;
        console.error(" [ NextOps Project Create CRASH ]:", err.message);
        throw err;
      }
    },

     aggregate: async (args?: Prisma.ProjectAggregateArgs) => {
      console.log(" [Database-Aggregation]: Розрахунок реальних лімітів для користувача:", args?.where?.userId || "all");
      // ПРОДАКШЕН ФІКС: якщо args є undefined, передаємо порожній об'єкт {}, щоб задовольнити строгі типи Prisma
      return await realPrisma.project.aggregate(args ?? {});
    },


    count: async (args?: Prisma.ProjectCountArgs): Promise<number> => {
      console.log(
        " [Database-Count]: Підрахунок реальних проектів за фільтром:",
        args?.where?.status || "all",
      );
      return await realPrisma.project.count(args);
    },
  };
  webhookConfig = {
    findMany: async (
      args?: Prisma.WebhookConfigFindManyArgs,
    ): Promise<import("@prisma/client").WebhookConfig[]> => {
      return await realPrisma.webhookConfig.findMany(args);
    },
    create: async (
      args: Prisma.WebhookConfigCreateArgs,
    ): Promise<import("@prisma/client").WebhookConfig> => {
      try {
        return await realPrisma.webhookConfig.create(args);
      } catch (prismaErr: unknown) {
        const err = prismaErr as Error;
        console.error(" [ NextOps Webhook Create CRASH ]:", err.message);
        throw err;
      }
    },
    update: async (
      args: Prisma.WebhookConfigUpdateArgs,
    ): Promise<import("@prisma/client").WebhookConfig> => {
      return await realPrisma.webhookConfig.update(args);
    },
    delete: async (
      args: Prisma.WebhookConfigDeleteArgs,
    ): Promise<import("@prisma/client").WebhookConfig> => {
      console.log(
        " [MongoDB Atlas]: Видалення конфігурації вебхука з бази:",
        args.where.id || "unknown",
      );
      return await realPrisma.webhookConfig.delete(args);
    },
  };

  $runCommand = async (command: Record<string, unknown>) => {
    return (
      realPrisma as unknown as {
        $runCommand: (cmd: Record<string, unknown>) => Promise<unknown>;
      }
    ).$runCommand(command);
  };
}

// Експортуємо наш адаптер під виглядом оригінального клієнта
export const prisma = new RealPrismaHub() as unknown as OriginalPrismaClient;
export const PrismaClient = OriginalPrismaClient;

export default prisma;
