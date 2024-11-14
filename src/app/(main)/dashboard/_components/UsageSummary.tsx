"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type UsageSummaryProps = {};

export const UsageSummary = ({}: UsageSummaryProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">Monthly executions</span>
          <span className="text-xl font-bold">1,234</span>{" "}
        </div>
        <Progress value={80} />
      </CardContent>
    </Card>
  );
};