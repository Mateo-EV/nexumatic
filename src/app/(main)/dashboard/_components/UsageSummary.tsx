import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type Plan, type Subscription } from "@/server/db/schema";
import { getLimitMontlyExecutions } from "@/server/subscription";

type UsageSummaryProps = {
  monthlyExecutions: number;
  subscription: (Subscription & { plan: Plan }) | null;
};

export const UsageSummary = ({
  monthlyExecutions,
  subscription,
}: UsageSummaryProps) => {
  const limitExecutions = getLimitMontlyExecutions(subscription?.plan);

  const progressValue = limitExecutions
    ? (monthlyExecutions / limitExecutions) * 100
    : 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">Monthly executions</span>
          <span className="text-xl font-bold">{monthlyExecutions}</span>{" "}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Progress value={progressValue} />
            </TooltipTrigger>
            <TooltipContent>
              {limitExecutions === Infinity ? "∞" : limitExecutions}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};
