import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type TaskLogStatus } from "@/server/db/schema";
import {
  AlertCircleIcon,
  CheckIcon,
  FileTextIcon,
  TriangleAlertIcon,
} from "lucide-react";

type LogsAndReportsProps = {
  logs: {
    id: number;
    logMessage: string;
    status: TaskLogStatus;
    workflowId: string;
  }[];
};

const Icon = {
  error: AlertCircleIcon,
  success: CheckIcon,
  warning: TriangleAlertIcon,
};
const getLogColor = (type: string) => {
  switch (type) {
    case "success":
      return "text-green-400";
    case "warning":
      return "text-yellow-400";
    case "error":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
};

const getIcon = (status: TaskLogStatus) => {
  const Component = Icon[status];

  return <Component className={`h-4 w-4 ${getLogColor(status)}`} />;
};

export const LogsAndReports = ({ logs }: LogsAndReportsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports & Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileTextIcon className="h-4 w-4" />
            <span>Executions Report - Last Week</span>
          </div>
          {logs.map((log) => (
            <div className="flex items-center gap-2" key={log.id}>
              {getIcon(log.status)}
              <span>{log.logMessage}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
