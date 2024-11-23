import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPlans, getSubscription } from "@/server/db/data";
import { CheckCircleIcon, XIcon } from "lucide-react";
import { CheckoutSessionButton } from "./_components/CheckoutSessionButton";
import { CancelSubscriptionButton } from "./_components/CancelSubscriptionButton";

export default async function BillingPage() {
  const plans = await getPlans();
  const subscription = await getSubscription();

  return (
    <main className="container mx-auto py-10">
      <div className="sticky top-0 flex items-center justify-between border-b bg-background/50 p-6 backdrop-blur-lg">
        <h1 className="text-4xl">Billing</h1>
      </div>

      <Card className="mb-8 mt-4">
        <CardHeader>
          <CardTitle>Current Subscription</CardTitle>
          <CardDescription>
            Manage your current plan and billing details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">
                {subscription?.plan.name ?? "Free Plan"}
              </p>
              {subscription && subscription.status !== "canceled" && (
                <p className="text-sm text-gray-500">
                  Next billing date:{" "}
                  {subscription.currentPeriodEnd.toLocaleDateString()}
                </p>
              )}
            </div>
            {subscription && (
              <Badge
                variant={
                  subscription.status === "active" ? "default" : "destructive"
                }
                className="capitalize"
              >
                {subscription.status}
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="font-semibold">
            {subscription?.plan.price ?? "$0"}/month
          </p>
          {subscription && subscription.status === "active" && (
            <CancelSubscriptionButton />
          )}
        </CardFooter>
      </Card>

      <h2 className="mb-4 text-2xl font-semibold">Available Plans</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={
              plan.id === subscription?.plan.id ||
              (plan.id === "free-plan" && subscription === null)
                ? "border-primary"
                : ""
            }
          >
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.price}/month</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <CheckCircleIcon className="mr-2 size-4 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {plan.id === subscription?.plan.id ||
              (plan.id === "free-plan" && subscription === null) ? (
                <Button className="w-full" disabled>
                  Current Plan
                </Button>
              ) : (
                <CheckoutSessionButton plan={plan} />
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </main>
  );
}
