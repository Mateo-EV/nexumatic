"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Bar, BarChart, XAxis } from "recharts";

type EfficiencyAnalysisProps = {
  efficiencyAnalisis: { day: string; efficiency: number }[];
};
export const EfficiencyAnalysis = ({
  efficiencyAnalisis,
}: EfficiencyAnalysisProps) => {
  const totalEfficiency = efficiencyAnalisis.reduce((acc, curr) => {
    return acc + curr.efficiency;
  }, 0);

  const average = totalEfficiency / efficiencyAnalisis.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Efficiency Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold">{average}%</div>
          <div className="text-sm text-muted-foreground">
            Average Efficiency
          </div>
        </div>
        <Progress value={average} className="h-2" />
        <ChartContainer
          config={{
            efficiency: {
              label: "Eficiencia",
              color: "hsl(var(--primary))",
            },
          }}
          className="h-[123px] w-full"
        >
          <BarChart
            data={efficiencyAnalisis}
            margin={{
              top: 5,
              right: 10,
              left: 10,
              bottom: 0,
            }}
          >
            <XAxis
              dataKey="day"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <Bar
              dataKey="efficiency"
              fill="var(--color-efficiency)"
              radius={4}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant="outline">
          See Details
        </Button>
      </CardFooter>
    </Card>
  );
};
