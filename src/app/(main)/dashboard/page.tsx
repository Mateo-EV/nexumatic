import { ActiveWorkflows } from "./_components/ActiveWorkflows";
import { ConnectedIntegrations } from "./_components/ConnectedIntegrations";
import { EfficiencyAnalysis } from "./_components/EfficiencyAnalysis";
import { LogsAndReports } from "./_components/LogsAndReports";
import { RecentActivity } from "./_components/RecentActivity";
import { SubscriptionStatus } from "./_components/SubscriptionStatus";
import { UsageSummary } from "./_components/UsageSummary";

export default function DashboardPage() {
  return (
    <main className="container grid gap-4 p-4 md:gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <SubscriptionStatus />
        <RecentActivity />
        <UsageSummary />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ActiveWorkflows />
        <ConnectedIntegrations />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <LogsAndReports />
        <EfficiencyAnalysis />
      </div>
    </main>
  );
}
