import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircleIcon, FileTextIcon } from "lucide-react";

type LogsAndReportsProps = {};

export const LogsAndReports = ({}: LogsAndReportsProps) => {
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
          <div className="flex items-center gap-2">
            <AlertCircleIcon className="h-4 w-4 text-red-500" />
            <span>Error Log - Last 24 Hours</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircleIcon className="h-4 w-4 text-red-500" />
            <span>Error Log - Last 24 Hours</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircleIcon className="h-4 w-4 text-red-500" />
            <span>Error Log - Last 24 Hours</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircleIcon className="h-4 w-4 text-red-500" />
            <span>Error Log - Last 24 Hours</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircleIcon className="h-4 w-4 text-red-500" />
            <span>Error Log - Last 24 Hours</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant="outline">
          See All Logs
        </Button>
      </CardFooter>
    </Card>
  );
};
