import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusIcon, ZapIcon } from "lucide-react";

type ActiveWorkflowsProps = {};

export const ActiveWorkflows = ({}: ActiveWorkflowsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Workflows</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ZapIcon className="h-4 w-4" />
              <span>Customer Onboarding</span>
            </div>
            <span className="rounded-full bg-primary/10 px-2 py-1 text-xs">
              Running
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ZapIcon className="h-4 w-4" />
              <span>Data Sync</span>
            </div>
            <span className="rounded-full bg-muted px-2 py-1 text-xs">
              Programmed
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">
          <PlusIcon className="mr-2 h-4 w-4" />
          Create New Workflow
        </Button>
      </CardFooter>
    </Card>
  );
};
