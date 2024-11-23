"use client";

import { createCheckoutSession } from "@/app/(home)/payments/actions";
import { Button, SubmitButton } from "@/components/ui/button";
import { env } from "@/env";
import { type Plan } from "@/server/db/schema";
import { loadStripe } from "@stripe/stripe-js";
import { ArrowRightIcon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

type CheckoutSessionButtonProps = {
  plan: Plan;
};

export const CheckoutSessionButton = ({ plan }: CheckoutSessionButtonProps) => {
  const isFreePlan = plan.id === "free-plan";

  const [isPending, startTransition] = useTransition();

  if (isFreePlan) {
    return (
      <Button className="w-full" variant="secondary" disabled>
        Get Now
        <ArrowRightIcon className="ml-2 size-4" />
      </Button>
    );
  }

  function handleCheckoutSession() {
    startTransition(async () => {
      try {
        const data = await createCheckoutSession(plan.id);

        if (data.error) {
          toast.error(data.error);
          return;
        }

        const stripeClient = await loadStripe(
          env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        );

        await stripeClient!.redirectToCheckout({
          sessionId: data.sessionId!,
        });
      } catch (error) {
        console.log(error);
        toast.error("Something went wrong");
      }
    });
  }

  return (
    <SubmitButton
      isSubmitting={isPending}
      className="w-full"
      variant="outline"
      onClick={handleCheckoutSession}
    >
      Get Now
      <ArrowRightIcon className="ml-2 size-4" />
    </SubmitButton>
  );
};
