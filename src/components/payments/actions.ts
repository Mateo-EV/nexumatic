"use server";

import { env } from "@/env";
import { stripe } from "@/lib/stripe";
import { getSession } from "@/server/session";

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
    });

    return { sessionId: checkoutSession.id };
  } catch (error) {
    console.log(error);
    return { error: "Something went wrong" };
  }
}
