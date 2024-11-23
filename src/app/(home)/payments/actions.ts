"use server";

import { env } from "@/env";
import { stripe } from "@/lib/stripe";
import { db } from "@/server/db";
import { getSubscription } from "@/server/db/data";
import { subscriptions, users } from "@/server/db/schema";
import { getSession } from "@/server/session";
import { eq } from "drizzle-orm";

export async function createCheckoutSession(priceId: string) {
  const session = await getSession();

  if (!session) return { error: "Unauthorized" };

  if (!priceId || priceId.length === 0) return { error: "Bad Request" };

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        userId: session.user.id,
        email: session.user.email,
      },
      mode: "subscription",
      success_url: `${env.NEXT_PUBLIC_BASE_URL}/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.NEXT_PUBLIC_BASE_URL}`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          userId: session.user.id,
          email: session.user.email,
        },
      },
    });

    return { sessionId: checkoutSession.id };
  } catch (error) {
    console.log(error);
    return { error: "Something went wrong" };
  }
}

export async function cancelSubscription() {
  const session = await getSession();

  if (!session) return { error: "Unauthorized" };

  const subscription = await getSubscription();

  if (!subscription || subscription.status !== "active") {
    return { message: "Subscription canceled" };
  }

  try {
    await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

    const [subscriptionUpdated] = await db
      .update(subscriptions)
      .set({ status: "canceled" })
      .where(eq(subscriptions.id, subscription.id))
      .returning({ status: subscriptions.status });

    if (subscriptionUpdated?.status === "canceled") {
      await db
        .update(users)
        .set({ subscriptionStripeId: null })
        .where(eq(users.id, session.user.id));
    }

    return { message: "Subscription canceled" };
  } catch (error) {
    console.log(error);
    return { message: "Error while canceling subscription" };
  }
}
