import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ZapIcon } from "lucide-react";

type RecentActivityProps = {};

export const RecentActivity = ({}: RecentActivityProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ZapIcon className="h-4 w-4" />
            <span>Workflow ;name; executed </span>
          </div>
          <div className="flex items-center gap-2">
            <ZapIcon className="h-4 w-4" />
            <span>New workflow created: </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
