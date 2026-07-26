import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Зчитуємо реальних інженерів з MongoDB Atlas
    const realUsers = await prisma.user.findMany({
      select: { 
        id: true, 
        name: true, 
        role: true, 
        plan: true,
        image: true 
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Фільтруємо дублікати за іменем розробника за допомогою Map
    const uniqueMap = new Map();
    
    // 🔥 ГОЛОВНИЙ ФІКС ТИПІЗАЦІЇ: Явно вказуємо тип 'any' для параметра 'u'
    // Це повністю усуває помилку 'implicitly has an any type' у збірці Vercel
    realUsers.forEach((u: any) => {
      const lowerName = u.name ? u.name.toLowerCase().trim() : "";
      if (!uniqueMap.has(lowerName) && lowerName !== "") {
        uniqueMap.set(lowerName, u);
      }
    });
    const uniqueRealUsers = Array.from(uniqueMap.values()).slice(0, 5);

    // 3. Преміальні фейкові інкогніто-ноди для розширення потоку
    const cyberFakeUsers = [
      { id: "fake_1", name: "shadow_routing", role: "Wasm Security Architect", plan: "ENTERPRISE", image: "/images/incognita.jpg" },
      { id: "fake_2", name: "cyber_cop", role: "NoSQL Cluster Validator", plan: "PRO", image: "/images/incognita.jpg" },
      { id: "fake_3", name: "quantum_ops", role: "AI Node Optimizer", plan: "FREE", image: "/images/incognita.jpg" }
    ];

    // 4. Об'єднуємо реальних унікальних користувачів та кібер-інкогніто
    const finalStream = [...uniqueRealUsers, ...cyberFakeUsers];

    return NextResponse.json({ success: true, users: finalStream }, { status: 200 });
  } catch (error: any) {
    console.error("⚠️ [ API_USERS_MODERN_STREAM_CRASH ]:", error);
    return NextResponse.json({ success: false, error: "Помилка сервера при читанні бази даних" }, { status: 500 });
  }
}
