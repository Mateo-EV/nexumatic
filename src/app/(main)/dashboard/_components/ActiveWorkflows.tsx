import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type WorkFlow } from "@/server/db/schema";
import { PlusIcon, ZapIcon } from "lucide-react";
import { Link } from "next-view-transitions";

type ActiveWorkflowsProps = {
  activeWorkflows: WorkFlow[];
};

export const ActiveWorkflows = ({ activeWorkflows }: ActiveWorkflowsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Workflows</CardTitle>
      </CardHeader>
      <CardContent>
        {activeWorkflows.length > 0 ? (
          <div className="space-y-4">
            {activeWorkflows.map((workflow) => (
              <div
                className="flex items-center justify-between"
                key={workflow.id}
              >
                <div className="flex items-center gap-2">
                  <ZapIcon className="h-4 w-4" />
                  <span>{workflow.name}</span>
                </div>
                <span
                  className={`rounded-full ${workflow.isRunning ? "bg-primary/10" : "bg-muted"} px-2 py-1 text-xs`}
                >
                  {workflow.isRunning ? "Running" : "Active"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <h3 className="text-muted-foreground">
            No actives workflows, create or activate to see here
          </h3>
        )}
      </CardContent>
      <CardFooter className="mt-auto">
        <Link
          href="/workflows"
          className={buttonVariants({ className: "w-full" })}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Create New Workflow
        </Link>
      </CardFooter>
    </Card>
  );
};
