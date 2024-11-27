"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { type WorkFlow } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { useTransitionRouter } from "next-view-transitions";
import { useEffect } from "react";
import { WorkflowDeleteButton } from "./WorkflowDeleteButton";
import { WorkflowStateButton } from "./WorkflowStateButton";

export const Workflows = () => {
  const { data: workflows } = api.workflow.getAllFromUser.useQuery();

  if (!workflows) return <WorkflowsSkeleton />;

  if (workflows.length)
    return workflows.map((workflow) => (
      <Workflow workflow={workflow} key={workflow.id} />
    ));

  return (
    <div className="mt-28 flex items-center justify-center text-muted-foreground">
      No Workflows
    </div>
  );
};

type WorkflowProps = {
  workflow: WorkFlow;
};

const WorkflowsSkeleton = () => {
  const workflow = <Skeleton className="h-20 w-full" />;

  return (
    <>
      {workflow}
      {workflow}
      {workflow}
    </>
  );
};

const handleClickStopPropagation = (e: React.MouseEvent) => {
  e.stopPropagation();
};

const Workflow = ({ workflow }: WorkflowProps) => {
  const router = useTransitionRouter();
  const href = `/workflows/${workflow.id}`;

  useEffect(() => {
    router.prefetch(href);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClickWorkflow = () => {
    const selection = window.getSelection();
    if (selection && selection.type === "Range") {
      return;
    }
    router.push(href);
  };

  return (
    <Card
      className="group flex w-full cursor-pointer items-center justify-between transition-colors hover:bg-secondary/20"
      onClick={handleClickWorkflow}
      style={{ viewTransitionName: `workflow-container-${workflow.id}` }}
    >
      <CardHeader>
        <CardTitle
          className="text-lg"
          style={{ viewTransitionName: `workflow-name-${workflow.id}` }}
        >
          {workflow.name}
        </CardTitle>
        {workflow.description && (
          <CardDescription
            style={{
              viewTransitionName: `workflow-description-${workflow.id}`,
            }}
          >
            {workflow.description}
          </CardDescription>
        )}
        <CardDescription className="font-light italic">
          {workflow.id}
        </CardDescription>
      </CardHeader>
      <div
        className="flex items-center p-4"
        onClick={handleClickStopPropagation}
      >
        <WorkflowDeleteButton workflow={workflow} />
        <WorkflowStateButton
          workflowId={workflow.id}
          isActive={workflow.isActive}
        />
      </div>
    </Card>
  );
};
