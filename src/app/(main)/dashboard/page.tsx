import { Suspense } from "react";
import { ActiveWorkflows } from "./_components/ActiveWorkflows";
import { ConnectedIntegrations } from "./_components/ConnectedIntegrations";
import { EfficiencyAnalysis } from "./_components/EfficiencyAnalysis";
import { LogsAndReports } from "./_components/LogsAndReports";
import { RecentActivity } from "./_components/RecentActivity";
import { SubscriptionStatus } from "./_components/SubscriptionStatus";
import { UsageSummary } from "./_components/UsageSummary";
import {
  getActiveWorkflows,
  getConnections,
  getEfficiencyAnalysis,
  getExecutedWorkflows,
  getLogs,
  getMonthlyExecutions,
} from "./data";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  return (
    <main className="container grid gap-4 p-4 md:gap-6">
      <Suspense
        fallback={
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
          </>
        }
      >
        <DashboardContent />
      </Suspense>
    </main>
  );
}

async function DashboardContent() {
  const [
    monthlyExecutions,
    executedWorkflows,
    activeWorkflows,
    connections,
    logs,
    efficiencyAnalysis,
  ] = await Promise.all([
    getMonthlyExecutions(),
    getExecutedWorkflows(),
    getActiveWorkflows(),
    getConnections(),
    getLogs(),
    getEfficiencyAnalysis(),
  ]);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <SubscriptionStatus />
        <RecentActivity executions={executedWorkflows} />
        <UsageSummary monthlyExecutions={monthlyExecutions} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ActiveWorkflows activeWorkflows={activeWorkflows} />
        <ConnectedIntegrations connections={connections} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <LogsAndReports logs={logs} />
        <EfficiencyAnalysis efficiencyAnalisis={efficiencyAnalysis} />
      </div>
    </>
  );
}
