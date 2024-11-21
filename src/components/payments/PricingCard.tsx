"use client";

import { env } from "@/env";
import { cn } from "@/lib/utils";
import { type Plan } from "@/server/db/schema";
import { loadStripe } from "@stripe/stripe-js";
import { CheckCircle2Icon } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { createCheckoutSession } from "./actions";

export default function PricingCard({ plan }: { plan: Plan }) {
  const { data } = useSession();

  return (
    <Card
      className={cn(
        `flex w-72 flex-col justify-between py-1 ${plan.name === "Professional Plan" ? "border-rose-400" : "border-primary"} mx-auto sm:mx-0`,
        {
          "animate-background-shine bg-white bg-[length:200%_100%] transition-colors dark:bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)]":
            plan.name === "Enterprise Plan",
        },
      )}
    >
      <div>
        <CardHeader className="pb-8 pt-4">
          <CardTitle className="text-lg text-zinc-700 dark:text-zinc-300">
            {plan.name}
          </CardTitle>
          <div className="flex gap-0.5">
            <h2 className="text-3xl font-bold">{"$" + 50}</h2>
            <span className="mb-1 flex flex-col justify-end text-sm">
              /month
            </span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {plan.features.map((feature: string) => (
            <CheckItem key={feature} text={feature} />
          ))}
        </CardContent>
      </div>
      <CardFooter className="mt-2">
        <Button
          onClick={async () => {
            if (data?.user.id) {
              try {
                const data = await createCheckoutSession(plan.id);

                if (data.error) {
                  toast.error(data.error);
                  return;
                }

                const stripeClient = await loadStripe(
                  env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
                );

                const response = await stripeClient!.redirectToCheckout({
                  sessionId: data.sessionId!,
                });

                return response;
              } catch (error) {
                console.log(error);
                toast.error("Something went wrong");
              }
            } else {
              toast.error("Please login or sign up to purchase");
            }
          }}
          className="relative inline-flex w-full items-center justify-center rounded-md bg-black px-6 font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 dark:bg-white dark:text-black"
          type="button"
        >
          <div className="absolute -inset-0.5 -z-10 rounded-lg bg-gradient-to-b from-primary to-secondary opacity-75 blur" />
          Get Now
        </Button>
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
