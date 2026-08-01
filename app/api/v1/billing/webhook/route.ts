import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface MockUserWebhookUpdateInput {
  where: { id: string };
  data: {
    stripeCustomerId: string;
    plan: "PRO" | "ENTERPRISE";
    subscriptionActive: boolean;
    subscriptionExpires: Date;
  };
}

export async function POST(req: NextRequest): Promise<Response> {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Ініціалізація всередині POST хендлера для стабільності під час yarn build
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2025-02-24.preview" as any, // Фікс сумісності версії API Stripe
  });
  try {
    const rawBody = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || "",
      );
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error(`🚨 [STRIPE_SIGNATURE_ERROR]: ${errorMsg}`);
      return NextResponse.json(
        { error: "Verification failed" },
        { status: 400 },
      );
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.userId;
      const planType =
        session.metadata?.planType === "ENTERPRISE" ? "ENTERPRISE" : "PRO";

      if (userId) {
        const expiresDate = new Date();
        expiresDate.setDate(expiresDate.getDate() + 30);

        // Локальне строге приведення моделі до нашого інтерфейсу (замість брудного any)
        const userModel = prisma.user as unknown as {
          update: (args: MockUserWebhookUpdateInput) => Promise<unknown>;
        };

        await userModel.update({
          where: { id: userId },
          data: {
            stripeCustomerId: (session.customer as string) || session.id,
            plan: planType,
            subscriptionActive: true,
            subscriptionExpires: expiresDate,
          },
        });

        console.log(
          ` [STRIPE_SUCCESS]: Plan ${planType} activated for user ${userId}`,
        );
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error(" [ STRIPE_WEBHOOK_ROUTE_CRASH ]:", err.message);
    return NextResponse.json(
      { error: "Webhook handler crash" },
      { status: 500 },
    );
  }
}
