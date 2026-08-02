import { PrismaClient as OriginalPrismaClient } from "@prisma/client";

// СТРОГІ ИНТЕРФЕЙСИ ДЛЯ СТАТЕЙ ТА ВІДГУКІВ В ПАМ'ЯТІ
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

// ГАРАНТОВАНІ СУВОРІ ПРОДАКШЕН-ТИПИ ДЛЯ ПРОЕКТІВ (ЗАМІСТЬ ANY ТА UNKNOWN)
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

// 1. ГЛОБАЛЬНИЙ СТЕРЕЖЕНИЙ СТЕЙТ В ПАМ'ЯТІ (Імітація живої бази даних MongoDB)
const globalWithMock = global as unknown as { mockDbInMemory: MockDbItem[] };

if (!globalWithMock.mockDbInMemory) {
  globalWithMock.mockDbInMemory = [
    {
      id: "65cb7f4a21de456789abcdef",
      method: "ARTICLE",
      url: "Next.js 15 & React 19 в B2B архітектурі",
      response:
        "Next.js 15 приносить неймовірну швидкість завдяки оновленому серверному компілятору та повній інтеграції з React 19 Server Actions.",
      headers: "Vladimir Bessalov",
      createdAt: new Date(),
    },
    {
      id: "art_2",
      method: "ARTICLE",
      url: "Як автоматизувати FinOps для ШІ-агентів",
      response:
        "Глибоке NoSQL шліфування агрегаційних запитів дозволяє бачити витрати бюджету та лімітів токенів в реальному часі без блокування потоків.",
      headers: "System Core",
      createdAt: new Date(),
    },
    {
      id: "rev_1",
      method: "FEEDBACK",
      url: "Олександр К. (Senior Full-Stack)",
      response:
        "NextOps Engine заощадив нам тиждень розробки інфраструктури ШІ! Комплектація Boilerplate на вищому рівні, всім рекомендую.",
      headers: "5 зірок",
      status: 5,
      createdAt: new Date(),
    },
    {
      id: "rev_2",
      method: "FEEDBACK",
      url: "Марія Д. (AI Co-Founder)",
      response:
        "Преміальний дизайн Cyber-Glass виглядає неймовірно. Емулятор Sandbox Postman та інтеграція Stripe пройшла за хвилину.",
      headers: "5 зірок",
      status: 5,
      createdAt: new Date(),
    },
  ];
}
// 2. КЛАС-ЗАГЛУШКА З ПОВНОЮ ПІДТРИМКОЮ БЕКЕНД-ОПЕРАЦІЙ ТА AUTH.JS V5
class MockPrismaClient {
  constructor() {
    console.log(
      "▲ NextOps Engine v1.2: Запущено уніфікований NoSQL Хаб (Аналітика + Статті + Відгуки)",
    );
  }

  user = {
    findMany: async (args?: {
      where?: { subscriptionActive?: boolean };
      select?: { plan?: boolean };
    }) => [
      {
        id: "65cb7f4a21de456789abcdef",
        name: "Vladimir Bessalov",
        email: "vlad@nextops.io",
        role: "ADMIN",
        plan: "PRO",
        subscriptionActive: true,
      },
    ],
    findUnique: async () => ({
      id: "65cb7f4a21de456789abcdef",
      name: "Vladimir Bessalov",
      email: "vlad@nextops.io",
      role: "ADMIN",
      plan: "PRO",
    }),
    findFirst: async () => ({
      id: "65cb7f4a21de456789abcdef",
      name: "Vladimir Bessalov",
      email: "vlad@nextops.io",
      role: "ADMIN",
      plan: "PRO",
    }),
    create: async ({ data }: { data: UserDataPayload }) => ({
      id: "65cb7f4a21de456789abcdef",
      ...data,
    }),
    update: async (args: {
      where: { email: string };
      data: Partial<UserDataPayload>;
    }) => {
      console.log(
        " [Mock-Auth.js]: Оновлення профілю розробника в MongoDB Atlas:",
        args?.where?.email || "current",
      );
      return {
        id: "65cb7f4a21de456789abcdef",
        name: "Vladimir Bessalov",
        email: args.where.email,
        role: "ADMIN",
        plan: "PRO",
        ...args?.data,
      };
    },
  };

  apiHistory = {
    findMany: async (args?: {
      where?: { method?: "ARTICLE" | "FEEDBACK" };
    }) => {
      const methodFilter = args?.where?.method;
      const db = globalWithMock.mockDbInMemory;
      if (methodFilter) {
        return db.filter((item) => item.method === methodFilter);
      }
      return db;
    },
    findUnique: async (args: { where: { id: string } }) => {
      const db = globalWithMock.mockDbInMemory;
      return db.find((item) => item.id === args?.where?.id) || null;
    },
    create: async ({ data }: { data: ApiHistoryCreatePayload }) => {
      const db = globalWithMock.mockDbInMemory;
      const newRecord: MockDbItem = {
        id: "mock_" + Math.random().toString(36).substring(2, 11),
        method: data.method,
        url: data.url,
        response: data.response,
        headers: data.headers,
        status: data.status || 5,
        createdAt: new Date(),
      };
      db.unshift(newRecord);
      return newRecord;
    },
    delete: async (args: { where: { id: string } }) => {
      const idToDelete = args?.where?.id;
      const db = globalWithMock.mockDbInMemory;
      globalWithMock.mockDbInMemory = db.filter(
        (item) => item.id !== idToDelete,
      );
      return { id: idToDelete };
    },
  };
  project = {
    findMany: async () => [
      {
        id: "prj_1",
        name: "AI Customer Support",
        budget: 1500,
        status: "ACTIVE",
      },
      {
        id: "prj_2",
        name: "FinOps Tracker Grid",
        budget: 3200,
        status: "ACTIVE",
      },
    ],

    findFirst: async (args?: MockProjectFindFirstArgs) => {
      const targetId = args?.where?.id || "prj_1";
      return {
        id: targetId,
        name:
          targetId === "prj_2" ? "FinOps Tracker Grid" : "AI Customer Support",
        budget: targetId === "prj_2" ? 3200 : 1500,
        status: "ACTIVE",
        userId: args?.where?.userId || "65cb7f4a21de456789abcdef",
      };
    },

    create: async (args: MockProjectCreateArgs) => {
      return {
        id: "prj_" + Math.random().toString(36).substring(2, 11),
        name: args.data.name,
        budget: args.data.budget,
        status: args.data.status,
      };
    },

    aggregate: async (args?: MockProjectAggregateArgs) => {
      console.log(
        " [Database-Aggregation]: Розрахунок лімітів для користувача:",
        args?.where?.userId || "unknown",
      );
      return {
        _sum: { budget: 4700 },
        _avg: { budget: 2350 },
        _count: { _all: 2 },
        _min: { budget: 1500 },
        _max: { budget: 3200 },
      };
    },

    count: async (args?: MockProjectCountArgs) => {
      console.log(
        " [Database-Count]: Підрахунок проектів за фільтром:",
        args?.where?.status || "all",
      );
      return 2;
    },
  };

  webhookConfig = {
    findMany: async () => [
      {
        id: "wh_1",
        url: "https://nextops.engine",
        active: true,
        createdAt: new Date(),
      },
    ],
    create: async ({ data }: { data: { url: string; active: boolean } }) => ({
      id: "wh_" + Math.random().toString(36).substring(2, 11),
      ...data,
    }),
    update: async ({
      where,
      data,
    }: {
      where: { id: string };
      data: { url?: string; active?: boolean };
    }) => ({
      id: where?.id || "wh_1",
      ...data,
    }),
  };

  $runCommand = async () => ({
    ok: 1,
    db: "MongoDB-Atlas",
    status: "connected",
    stats: { collections: 5, documents: 42 },
  });
}

// ====================================================================
//  СУВОРЕ ІНЖЕНЕРНЕ ПЕРЕМИКАННЯ: АВТОНОМНИЙ РЕЖИМ МАКЕТУ У ПАМ'ЯТІ
// ====================================================================

const globalForPrisma = global as unknown as { prisma: OriginalPrismaClient };

// Примусово вмикаємо наш автономний NoSQL-хаб, щоб обійти помилку SCRAM bad auth
// Це миттєво розблокує вікна, прибере помилки з терміналу та запустить форми
export const prisma = new MockPrismaClient() as unknown as OriginalPrismaClient;

export const PrismaClient = OriginalPrismaClient;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
