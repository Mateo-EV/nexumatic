import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ZapIcon } from "lucide-react";

type RecentActivityProps = {
  executions: {
    id: string;
    name: string;
    lastExecution: Date | null;
  }[];
};

export const RecentActivity = ({ executions }: RecentActivityProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {executions.map(({ id, name }) => (
            <div className="flex items-center gap-2" key={id}>
              <ZapIcon className="h-4 w-4" />
              <span>Workflow &quot;{name}&quot; executed </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
