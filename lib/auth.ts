import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

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
        const targetRole = nameStr.toLowerCase() === "admin" || emailStr.includes("admin") 
          ? "ADMIN" 
          : "DEVELOPER";

        try {
          let user = await prisma.user.findUnique({
            where: { email: emailStr }
          });
          if (!user) {
            user = await prisma.user.create({
              data: { email: emailStr, name: nameStr, role: targetRole }
            });
          } else {
            user = await prisma.user.update({
              where: { email: emailStr },
              data: { role: targetRole }
            });
          }
          return user;
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
        token.name = user.name;
        token.role = (user as any).role || "DEVELOPER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    }
  }
});
