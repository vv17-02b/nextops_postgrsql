// C:\Users\Admin\Documents\my-unified-work-space\app\api\v1\billing\webhook\route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

// Примусова ізоляція рантайму Next.js 15 від статичного аналізу сторінок
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // 🔥 ГОЛОВНИЙ ФІКС ДЛЯ YARN BUILD: Ініціалізація перенесена всередину POST хендлера.
  // Тепер під час збірки відсутність ключа в оточенні не викликає краш системи.
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2026-06-24.dahlia",
  });

  try {
    const rawBody = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ""
      );
    } catch (err: any) {
      console.error(`🚨 [STRIPE_SIGNATURE_ERROR]: ${err.message}`);
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const userId = session.metadata?.userId;
      const planType = session.metadata?.planType || "PRO";

      if (userId) {
        const expiresDate = new Date();
        expiresDate.setDate(expiresDate.getDate() + 30);

        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeCustomerId: (session.customer as string) || session.id,
            plan: planType as any, 
            subscriptionActive: true,
            subscriptionExpires: expiresDate,
          },
        });

        console.log(`🎯 [STRIPE_SUCCESS]: Plan ${planType} activated for user ${userId}`);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("⚠️ [ STRIPE_WEBHOOK_ROUTE_CRASH ]:", error.message);
    return NextResponse.json({ error: "Webhook handler crash" }, { status: 500 });
  }
}
