import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

// Розширюємо інтерфейси (User, Session, JWT) для сумісності з NextAuth v5
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
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const emailStr = credentials.email as string;
        let nameStr = credentials.name as string;
        if (!nameStr) {
          const parts = emailStr.split("@");
          nameStr = parts[0] || "User";
        }
        
        const ownerEmailFromEnv = process.env.OWNER_EMAIL || "vlad@nextops.io";
        const targetRole = emailStr.toLowerCase() === ownerEmailFromEnv.toLowerCase() 
          ? "ADMIN" 
          : "DEVELOPER";

        try {
          // ГАРАНТОВАНИЙ ФІКС: Локально розширюємо типи методів для нашого Mock-клієнта Prisma
          const userModel = prisma.user as unknown as {
            findUnique: (args: { where: { email: string } }) => Promise<DatabaseUserResult | null>;
            create: (args: { data: { email: string; name: string; role: string } }) => Promise<DatabaseUserResult>;
            update: (args: { where: { email: string }; data: { role: string } }) => Promise<DatabaseUserResult>;
          };

          // 1. Пошук інженера в NoSQL кластері
          let dbUser = await userModel.findUnique({
            where: { email: emailStr }
          });
          
          if (!dbUser) {
            // 2. Якщо користувача немає — створюємо новий документ (Тепер об'єкт data повністю легальний)
            dbUser = await userModel.create({
              data: { email: emailStr, name: nameStr, role: targetRole }
            });
          } else {
            // 3. Якщо користувач є — оновлюємо його роль до актуального статусу
            dbUser = await userModel.update({
              where: { email: emailStr },
              data: { role: targetRole }
            });
          }
          
          // Повертаємо повністю типізований об'єкт, де є і plan, і image
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name ?? undefined;
        token.role = user.role || "DEVELOPER";
        token.plan = user.plan || "FREE";
        token.image = user.image || "/images/incognita.jpg";
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
