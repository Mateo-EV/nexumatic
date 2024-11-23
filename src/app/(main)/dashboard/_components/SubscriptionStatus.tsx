import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Plan, type Subscription } from "@/server/db/schema";

type SubscriptionStatusProps = {
  subscription: (Subscription & { plan: Plan }) | null;
};

function daysUntil(futureDate: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  futureDate.setHours(0, 0, 0, 0);

  const diffInMs =
    (futureDate as unknown as number) - (today as unknown as number);

  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  return Math.ceil(diffInDays);
}

export const SubscriptionStatus = ({
  subscription,
}: SubscriptionStatusProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {subscription && (
            <div
              className={`text-2xl font-bold capitalize ${subscription?.status === "active" ? "text-green-600" : "text-yellow-500"}`}
            >
              {subscription?.status}
            </div>
          )}
          <div className="text-sm text-muted-foreground">
            {subscription?.plan.name ?? "Free Plan"}{" "}
            {subscription &&
              `- Renewal in ${daysUntil(subscription?.currentPeriodEnd)} days`}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
