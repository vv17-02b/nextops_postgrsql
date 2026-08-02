import { PrismaClient as OriginalPrismaClient } from "@prisma/client";

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
const realPrisma = globalForPrisma.prisma || new OriginalPrismaClient({
  log: ['error', 'warn']
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
    findMany: async (args?: any) => {
      return await realPrisma.user.findMany(args);
    },
    findUnique: async (args?: any) => {
      return await realPrisma.user.findUnique(args);
    },
    findFirst: async (args?: any) => {
      return await realPrisma.user.findFirst(args);
    },
    create: async ({ data }: { data: UserDataPayload }) => {
      return await realPrisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          role: data.role,
          plan: "FREE" // Значення за замовчуванням з enum Plan
        }
      });
    },
    update: async (args: any) => {
      console.log(" [MongoDB Atlas]: Оновлення профілю розробника:", args?.where?.email || "current");
      return await realPrisma.user.update(args);
    },
  };

  apiHistory = {
    findMany: async (args?: { where?: { method?: "ARTICLE" | "FEEDBACK" } }) => {
      return await realPrisma.apiHistory.findMany({
        where: args?.where ? { method: args.where.method } : undefined
      });
    },
    findUnique: async (args: { where: { id: string } }) => {
      return await realPrisma.apiHistory.findUnique({
        where: { id: args.where.id }
      });
    },
    create: async ({ data }: { data: ApiHistoryCreatePayload }) => {
      return await realPrisma.apiHistory.create({
        data: {
          method: data.method,
          url: data.url,
          response: data.response,
          headers: data.headers,
          status: data.status || 200
        }
      });
    },
    delete: async (args: { where: { id: string } }) => {
      return await realPrisma.apiHistory.delete({
        where: { id: args.where.id }
      });
    },
  };

  project = {
    findMany: async (args?: any) => {
      const records = await realPrisma.project.findMany(args);
      // Мапимо title назад у name для сумісності з вашим фронтендом
      return records.map((r: any) => ({
        id: r.id,
        name: r.title,
        budget: r.budget,
        status: r.status,
        userId: r.userId
      }));
    },

    findFirst: async (args?: MockProjectFindFirstArgs) => {
      const record = await realPrisma.project.findFirst({
        where: args?.where ? { id: args.where.id, userId: args.where.userId, status: args.where.status } : undefined
      });
      if (!record) return null;
      return {
        id: record.id,
        name: record.title,
        budget: record.budget,
        status: record.status,
        userId: record.userId
      };
    },

    create: async (args: MockProjectCreateArgs) => {
      // Отримуємо ADMIN або будь-якого користувача для прив'язки, якщо userId не передано
      const defaultUser = await realPrisma.user.findFirst();
      if (!defaultUser) throw new Error("Спочатку створіть користувача (увійдіть через Auth.js) перед створенням проекту!");
      
      const record = await realPrisma.project.create({
        data: {
          title: args.data.name, // name мапиться в title згідно з schema.prisma
          budget: Number(args.data.budget),
          status: args.data.status,
          userId: defaultUser.id
        }
      });
      return {
        id: record.id,
        name: record.title,
        budget: record.budget,
        status: record.status
      };
    },

    aggregate: async (args?: MockProjectAggregateArgs) => {
      console.log(" [Database-Aggregation]: Розрахунок реальних лімітів для користувача:", args?.where?.userId || "all");
      return await realPrisma.project.aggregate({
        where: args?.where ? { id: args.where.id, userId: args.where.userId, status: args.where.status } : undefined,
        _sum: { budget: true },
        _avg: { budget: true },
        _count: { _all: true },
        _min: { budget: true },
        _max: { budget: true }
      });
    },

    count: async (args?: MockProjectCountArgs) => {
      console.log(" [Database-Count]: Підрахунок реальних проектів за фільтром:", args?.where?.status || "all");
      return await realPrisma.project.count({
        where: args?.where ? { id: args.where.id, userId: args.where.userId, status: args.where.status } : undefined
      });
    },
  };

  webhookConfig = {
    findMany: async (args?: any) => {
      const records = await realPrisma.webhookConfig.findMany(args);
      return records.map((r: any) => ({
        id: r.id,
        url: r.targetUrl,
        active: r.isActive,
        createdAt: r.createdAt
      }));
    },
    create: async ({ data }: { data: { url: string; active: boolean } }) => {
      const defaultUser = await realPrisma.user.findFirst();
      if (!defaultUser) throw new Error("Необхідний користувач для створення вебхуку!");

      const record = await realPrisma.webhookConfig.create({
        data: {
          targetUrl: data.url,      // url -> targetUrl
          isActive: data.active,    // active -> isActive
          targetEvent: "AI_TRIGGER", // Дефолтне поле зі схеми
          userId: defaultUser.id
        }
      });
      return {
        id: record.id,
        url: record.targetUrl,
        active: record.isActive
      };
    },
    update: async ({ where, data }: { where: { id: string }; data: { url?: string; active?: boolean } }) => {
      const record = await realPrisma.webhookConfig.update({
        where: { id: where.id },
        data: {
          targetUrl: data.url,
          isActive: data.active
        }
      });
      return {
        id: record.id,
        url: record.targetUrl,
        active: record.isActive
      };
    },
  };

  $runCommand = async (command: any) => {
    return (realPrisma as any).$runCommand(command);
  };
}

// Експортуємо наш адаптер під виглядом оригінального клієнта
export const prisma = new RealPrismaHub() as unknown as OriginalPrismaClient;
export const PrismaClient = OriginalPrismaClient;

export default prisma;
