import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { Plan } from "@prisma/client"; // Нативний енум для суворої типізації

// Розширюємо інтерфейси (User, Session, JWT) для сумісності з NextAuth v5 без any
declare module "next-auth" {
  interface User {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: string;
    image?: string | null;
    plan?: string;
  }
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      image?: string | null;
      plan?: string;
    }
  }
  interface JWT {
    id?: string;
    name?: string;
    role?: string;
    image?: string | null;
    plan?: string;
  }
}

// Суворий інженерний інтерфейс користувача з бази даних
interface DatabaseUserResult {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  image?: string | null;
}

export const { 
  handlers, 
  auth, 
  signIn, 
  signOut 
} = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        name: { label: "Name", type: "text" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email) return null;
        const emailStr = credentials.email as string;
        let nameStr = credentials.name as string;
        
        if (!nameStr) {
          const parts = emailStr.split("@");
          nameStr = parts[0] || "User";
        }
        
        // 1. ДИНАМІЧНЕ ВИЗНАЧЕННЯ ДОМЕНУ ПЛАТФОРМИ (Без .env для пошти)
        let siteDomain = "nextops.io";
        
        if (req instanceof Request) {
          try {
            const parsedUrl = new URL(req.url);
            siteDomain = parsedUrl.hostname.toLowerCase();
          } catch {
            const hostHeader = req.headers.get("host") || "";
            siteDomain = hostHeader.split(":")[0]?.toLowerCase() || "nextops.io";
          }
        } else if (req && typeof req === "object" && "headers" in req) {
          const headersObj = (req as Record<string, unknown>).headers as Record<string, string> | undefined;
          const hostHeader = headersObj?.host || "";
          siteDomain = hostHeader.split(":")[0]?.toLowerCase() || "nextops.io";
        }

        // 2. АВТОМАТИЧНИЙ ГУАРД ВЛАСНИКА ЗА ДОМЕНОМ
        const userEmailDomain = emailStr.split("@")[1]?.toLowerCase() || "";
        
        // Якщо пошта збігається з доменом або локальна розробка для владнання
        const isOwner = userEmailDomain === siteDomain || 
                        (siteDomain === "localhost" && emailStr.toLowerCase() === "vlad@nextops.io");

        const targetRole = isOwner ? "ADMIN" : "DEVELOPER";
        const targetPlan = isOwner ? "ENTERPRISE" : "FREE";

        try {
          // Локально розширюємо типи методів для нашого Mock-клієнта Prisma
          const userModel = prisma.user as unknown as {
            findUnique: (args: { where: { email: string } }) => Promise<DatabaseUserResult | null>;
            create: (args: { data: { email: string; name: string; role: string; plan: string } }) => Promise<DatabaseUserResult>;
            update: (args: { where: { email: string }; data: { role: string; plan: string } }) => Promise<DatabaseUserResult>;
          };

          // Пошук інженера в NoSQL кластері
          let dbUser = await userModel.findUnique({
            where: { email: emailStr }
          });
          
          if (!dbUser) {
            // При автоматичній реєстрації відразу виставляємо ліміти
            dbUser = await userModel.create({
              data: { email: emailStr, name: nameStr, role: targetRole, plan: targetPlan }
            });
          } else {
            // ПРОДАКШЕН ФІКС: Оновлюємо роль і план ТІЛЬКИ якщо вони реально змінилися в системі,
            // щоб не затирати поточні name та image, які користувач змінив через профіль
            if (dbUser.role !== targetRole || dbUser.plan !== targetPlan) {
              dbUser = await userModel.update({
                where: { email: emailStr },
                data: { role: targetRole, plan: targetPlan }
              });
            }
          }
          
          return {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role,
            plan: dbUser.plan || "FREE",
            image: dbUser.image || "/images/incognita.jpg"
          };
        } catch (dbError) {
          console.error("Помилка Prisma в Auth.js:", dbError);
          return null;
        }
      }
    })
  ],
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    // ПРОДАКШЕН ФІКС: Додано строгу обробку тригера оновлення токена (trigger та session)
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.name = user.name ?? undefined;
        token.role = user.role || "DEVELOPER";
        token.plan = user.plan || "FREE";
        token.image = user.image || "/images/incognita.jpg";
      }

      // Перехоплюємо сигнал оновлення профілю з фронтенду та перезаписуємо токен сесії
      if (trigger === "update" && session) {
        if (session.name !== undefined) token.name = String(session.name);
        if (session.image !== undefined) token.image = session.image ? String(session.image) : null;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
        session.user.plan = token.plan as string;
        session.user.image = token.image as string | null;
      }
      return session;
    }
  }
});
