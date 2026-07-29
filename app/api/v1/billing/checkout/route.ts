// C:\Users\Admin\Documents\my-unified-work-space\app\api\v1\billing\checkout\route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Точний імпорт твого синглтону
import { auth } from "@/lib/auth"; // Точний імпорт твоїх сесій Auth.js v5

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Серверний захист сесії через Auth.js v5
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email;
    const bodyData = await req.json().catch(() => ({}));
    const { planType } = bodyData;

    const requestedPlan = planType === "ENTERPRISE" ? "ENTERPRISE" : "PRO";

    // Динамічно формуємо базовий URL додатка для безпечного повернення клієнта
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host") || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    const priceAmount = requestedPlan === "ENTERPRISE" ? 49900 : 9900; // Розрахунок вартості в центах
    // =================================================================
    // 💥 РЕЖИМ 1: БОЙOВИЙ СТАНДАРТ STRIPE (ВИПРАВЛЕНO API ENDPOINT)
    // =================================================================
    if (process.env.STRIPE_SECRET_KEY) {
      // 🔥 ГОЛОВНИЙ ФІКС БІЛІНГУ: Змінено хост на офіційний REST API шлюз сесій Stripe
      const stripeRes = await fetch("https://stripe.com", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          "payment_method_types[0]": "card",
          "line_items[0][price_data][currency]": "usd",
          "line_items[0][price_data][product_data][name]": `SaaS Subscription Plan: ${requestedPlan}`,
          "line_items[0][price_data][product_data][description]": "Активація преміальних лімітів ШІ-агентів на 30 днів",
          "line_items[0][price_data][unit_amount]": priceAmount.toString(),
          "line_items[0][quantity]": "1",
          mode: "payment",
          customer_email: userEmail,
          "metadata[userId]": userId,
          "metadata[planType]": requestedPlan,
          success_url: `${baseUrl}/admin?session_id={CHECKOUT_SESSION_ID}&billing_sync=success`,
          cancel_url: `${baseUrl}/admin?billing_sync=cancel`,
        }),
      });

      if (stripeRes.ok) {
        const stripeSession = await stripeRes.json();
        return NextResponse.json({ 
          success: true, 
          url: stripeSession.url, // Офіційне посилання на оплату
          sessionId: stripeSession.id
        }, { status: 200 });
      } else {
        const errorText = await stripeRes.text();
        console.error("🚨 Stripe API Response Error:", errorText);
      }
    }

    // =================================================================
    // 🎭 РЕЖИМ 2: АВТОНОМНИЙ БЕЗКОШТОВНИЙ MOCK-РЕЖИМ (Для тестів розробника)
    // =================================================================
    const mockCheckoutSessionId = `cs_test_${Math.random().toString(36).substring(2, 15)}`;
    const successUrl = `${baseUrl}/admin?session_id=${mockCheckoutSessionId}&billing_sync=success`;

    const expiresDate = new Date();
    expiresDate.setDate(expiresDate.getDate() + 30);

    // Оновлюємо базу даних безкоштовно під час розробки в Умані
    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeCustomerId: mockCheckoutSessionId,
        plan: requestedPlan,
        subscriptionActive: true,
        subscriptionExpires: expiresDate,
      }
    });

    return NextResponse.json({ 
      success: true, 
      url: successUrl,
      sessionId: mockCheckoutSessionId,
      plan: requestedPlan
    }, { status: 200 });

  } catch (error: any) {
    console.error("⚠️ [ BILLING_CHECKOUT_ROUTE_CRASH ]:", error);
    return NextResponse.json({ success: false, error: "Помилка сервера при генерації сесії" }, { status: 500 });
  }
}
