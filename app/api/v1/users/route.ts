import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface MockUserStreamItem {
  id: string;
  name: string | null;
  role: string;
  plan: "FREE" | "PRO" | "ENTERPRISE";
  image?: string | null;
}

export async function GET(): Promise<Response> {
  try {
    // Приводимо до розширеного типу для сумісності з селекторами нашої Mock-бази даних
    const userModel = prisma.user as unknown as {
      findMany: (args?: {
        select?: Record<string, boolean>;
        orderBy?: Record<string, string>;
      }) => Promise<MockUserStreamItem[]>;
    };

    // 1. Зчитуємо реальних інженерів з MongoDB Atlas
    const realUsers = await userModel.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        plan: true,
        image: true,
      },
      orderBy: { createdAt: "desc" },
    });
    // 2. Фільтруємо дублікати за іменем розробника за допомогою Map
    const uniqueMap = new Map<string, MockUserStreamItem>();

    // ЧИСТИЙ ФІКС ТИПІЗАЦІЇ: Використовуємо наш строгий інтерфейс замість брудного 'any'
    realUsers.forEach((u: MockUserStreamItem) => {
      const lowerName = u.name ? u.name.toLowerCase().trim() : "";
      if (!uniqueMap.has(lowerName) && lowerName !== "") {
        uniqueMap.set(lowerName, u);
      }
    });
    const uniqueRealUsers = Array.from(uniqueMap.values()).slice(0, 5);

    // 3. Преміальні фейкові інкогніто-ноди для розширення потоку
    const cyberFakeUsers: MockUserStreamItem[] = [
      {
        id: "fake_1",
        name: "shadow_routing",
        role: "Wasm Security Architect",
        plan: "ENTERPRISE",
        image: "/images/incognita.jpg",
      },
      {
        id: "fake_2",
        name: "cyber_cop",
        role: "NoSQL Cluster Validator",
        plan: "PRO",
        image: "/images/incognita.jpg",
      },
      {
        id: "fake_3",
        name: "quantum_ops",
        role: "AI Node Optimizer",
        plan: "FREE",
        image: "/images/incognita.jpg",
      },
    ];

    // 4. Об'єднуємо реальних унікальних користувачів та кібер-інкогніто
    const finalStream = [...uniqueRealUsers, ...cyberFakeUsers];

    return NextResponse.json(
      { success: true, users: finalStream },
      { status: 200 },
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("⚠️ [ API_USERS_MODERN_STREAM_CRASH ]:", err.message);
    return NextResponse.json(
      { success: false, error: "Помилка сервера при читанні бази даних" },
      { status: 500 },
    );
  }
}
