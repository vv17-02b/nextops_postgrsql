import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Суворий серверний захист: перевіряємо токен розробника
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const bodyData = await req.json().catch(() => ({}));
    const { planType } = bodyData;

    // Валідуємо обраний тарифний план
    const requestedPlan = planType === "ENTERPRISE" ? "ENTERPRISE" : "PRO";

    // Динамічно формуємо базовий URL для редіректу (Local або Production)
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host") || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    // Генеруємо фірмовий ідентифікатор сесії процесингу Stripe
    const mockCheckoutSessionId = `cs_test_${Math.random().toString(36).substring(2, 15)}`;
    const successUrl = `${baseUrl}/admin?session_id=${mockCheckoutSessionId}&billing_sync=success`;

    // Розраховуємо дату закінчення лімітів підписки (+30 днів від поточної дати)
    const expiresDate = new Date();
    expiresDate.setDate(expiresDate.getDate() + 30);

    // 2. 🔥 ЗШИВАННЯ З БАЗОЮ: Оновлюємо NoSQL-документ користувача в MongoDB Atlas
    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeCustomerId: mockCheckoutSessionId,
        plan: requestedPlan,               // Активуємо обраний план (PRO або ENTERPRISE)
        subscriptionActive: true,          // Вмикаємо залізний доступ до лімітів
        subscriptionExpires: expiresDate,  // Записуємо ліміт часу на 30 днів
      }
    });

    // Повертаємо фронтенду успішну відповідь для запуску лоадера та редіректу
    return NextResponse.json({ 
      success: true, 
      url: successUrl,
      sessionId: mockCheckoutSessionId,
      plan: requestedPlan
    }, { status: 200 });

  } catch (error: any) {
    console.error("⚠️ [ BILLING_CHECKOUT_ROUTE_CRASH ]:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Помилка сервера при генерації сесії оплати" 
    }, { status: 500 });
  }
}
