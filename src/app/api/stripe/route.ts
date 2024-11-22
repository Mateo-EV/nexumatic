import { env } from "@/env";
import { stripe } from "@/lib/stripe";
import { db } from "@/server/db";
import { subscriptions, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

export async function POST(req: Request) {
  try {
    const sig = req.headers.get("Stripe-Signature");

    if (!sig) return Response.json({ message: "Bad Request" }, { status: 400 });

    const payload = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      payload,
      sig,
      env.STRIPE_WEBHOOK_SECRET,
    );

    switch (event.type) {
      case "customer.subscription.created":
        return handleSubscriptionEvent(event, "created");
      case "customer.subscription.updated":
        return handleSubscriptionEvent(event, "updated");
      case "customer.subscription.deleted":
        return handleSubscriptionEvent(event, "deleted");
      case "checkout.session.completed":
        return handleCheckoutSessionCompleted(event);
      default:
        return Response.json({ error: "Unhandle event type" }, { status: 400 });
    }
  } catch (error) {
    console.log(error);
    return Response.error();
  }
}

async function handleSubscriptionEvent(
  event: Stripe.Event,
  type: "created" | "updated" | "deleted",
) {
  const subscription = event.data.object as Stripe.Subscription;

  if (type === "deleted") {
    const [subscriptionUpdated] = await db
      .update(subscriptions)
      .set({ status: "canceled" })
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
      .returning({ status: subscriptions.status });

    if (subscriptionUpdated?.status === "canceled") {
      await db
        .update(users)
        .set({ subscriptionStripeId: null })
        .where(eq(users.id, subscription.metadata.userId!));
    }
  } else {
    const startDate = new Date(subscription.created * 1000);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);

    const subscriptionData = {
      status: subscription.status,
      currentPeriodStart: startDate,
      currentPeriodEnd: endDate,
      planId: subscription.items.data[0]!.price.id,
      userId: subscription.metadata.userId!,
    };

    if (type === "created") {
      await db
        .insert(subscriptions)
        .values({ ...subscriptionData, stripeSubscriptionId: subscription.id });
    } else {
      await db
        .update(subscriptions)
        .set(subscriptionData)
        .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
    }
  }

  return Response.json({ message: "Subscription handled successfully" });
}

async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const metadata = session.metadata!;

  const subscriptionId = session.subscription as string;

  await stripe.subscriptions.update(subscriptionId, { metadata });

  await db
    .update(users)
    .set({ subscriptionStripeId: subscriptionId })
    .where(eq(users.id, metadata.userId!));

  return Response.json({
    message: "Subscription metadata updated successfully",
  });
}
