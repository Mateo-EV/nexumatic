"use client";

import { env } from "@/env";
import { type Plan } from "@/server/db/schema";
import { loadStripe } from "@stripe/stripe-js";
import { CheckCircle2Icon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTransition } from "react";
import { toast } from "sonner";
import { SubmitButton } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { createCheckoutSession } from "./actions";
import { useLoginModal } from "@/providers/LoginModalProvider";

export default function PricingCard({ plan }: { plan: Plan }) {
  const { data } = useSession();
  const [isPending, startTransition] = useTransition();
  const { isOpen, setIsOpen } = useLoginModal();

  const isFreePlan = plan.id === "free-plan";

  return (
    <Card key={plan.name} className="flex flex-col">
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <div className="flex gap-0.5">
          <h2 className="text-3xl font-bold">{plan.price}</h2>
          <span className="mb-1 flex flex-col justify-end text-sm">/month</span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {plan.features.map((feature: string) => (
          <CheckItem key={feature} text={feature} />
        ))}
      </CardContent>
      <CardFooter className="mt-2">
        <SubmitButton
          isSubmitting={isPending}
          disabled={Boolean(data?.user.id && isFreePlan)}
          variant={data?.user.id && isFreePlan ? "secondary" : "default"}
          onClick={() => {
            if (!data?.user.id) {
              setIsOpen(true);
              return;
            }

            if (isFreePlan) return;

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
          }}
        >
          Get Now
        </SubmitButton>
      </CardFooter>
    </Card>
  );
}

const CheckItem = ({ text }: { text: string }) => (
  <div className="flex gap-2">
    <CheckCircle2Icon size={18} className="my-auto text-green-400" />
    <p className="pt-0.5 text-sm text-zinc-700 dark:text-zinc-300">{text}</p>
  </div>
);
