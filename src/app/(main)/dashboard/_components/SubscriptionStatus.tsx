import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const SubscriptionStatus = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold text-green-600">Active</div>
          <div className="text-sm text-muted-foreground">
            Pro Plan - Renewal in 30 days
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
