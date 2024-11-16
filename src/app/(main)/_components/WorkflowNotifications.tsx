"use client";

import { pusher } from "@/lib/pusher/client";
import { useAuth } from "@/providers/AuthProvider";
import { type WorkFlow, type WorkflowRun } from "@/server/db/schema";
import { api, type RouterOutputs } from "@/trpc/react";
import { type InfiniteData } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

type handleResponse = {
  workflowRun: WorkflowRun;
  workflow: WorkFlow;
};

function WorkflowNotifications() {
  const apiUtils = api.useUtils();
  const session = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const CHANNEL_NAME = `workflows-execution-for-${session.user.id}`;
    const channel = pusher.subscribe(CHANNEL_NAME);

    async function handleWorkflowInProgress({
      workflow,
      workflowRun,
    }: handleResponse) {
      await apiUtils.workflowLogs.getByWorkflow.cancel();

      apiUtils.workflowLogs.getByWorkflow.setInfiniteData(
        { workflowId: workflowRun.workflowId },
        (prev) => {
          if (!prev?.pages[0]) return;

          return {
            pageParams: prev.pageParams,
            pages: [
              {
                ...prev.pages[0],
                workflowRuns: [
                  {
                    ...workflowRun,
                    started_at: new Date(workflowRun.started_at),
                    taskLogs: [],
                  },
                  ...prev.pages[0].workflowRuns,
                ],
              },
              ...prev.pages.slice(1),
            ],
          };
        },
      );

      void apiUtils.workflowLogs.getByWorkflow.invalidate(
        { workflowId: workflowRun.workflowId },
        {
          predicate: (q) => {
            const prevData = q.state.data as unknown as InfiniteData<
              RouterOutputs["workflowLogs"]["getByWorkflow"]
            >;

            return !prevData?.pages[0];
          },
        },
      );

      const workflowPathname = `/workflows/${workflow.id}`;
      if (pathname !== workflowPathname) {
        toast(workflow.name, {
          description: "It's running right now",
          action: {
            label: "View",
            onClick: () => {
              router.push(workflowPathname);
            },
          },
          position: "bottom-right",
        });
      }
    }

    async function handleWorkflowCompleted({
      workflow,
      workflowRun,
    }: handleResponse) {
      await apiUtils.workflowLogs.getByWorkflow.cancel();

      apiUtils.workflowLogs.getByWorkflow.setInfiniteData(
        { workflowId: workflowRun.workflowId },
        (prev) => {
          if (!prev?.pages[0]) return;

          if (prev?.pages[0].workflowRuns[0]?.id !== workflowRun.id) return;

          return {
            pageParams: prev.pageParams,
            pages: [
              {
                ...prev.pages[0],
                workflowRuns: [
                  {
                    ...workflowRun,
                    started_at: new Date(workflowRun.started_at),
                    completed_at: new Date(workflowRun.completed_at!),
                    taskLogs: prev.pages[0].workflowRuns[0].taskLogs,
                  },
                  ...prev.pages[0].workflowRuns.slice(1),
                ],
              },
              ...prev.pages.slice(1),
            ],
          };
        },
      );

      void apiUtils.workflowLogs.getByWorkflow.invalidate(
        { workflowId: workflowRun.workflowId },
        {
          predicate: (q) => {
            const prevData = q.state.data as unknown as InfiniteData<
              RouterOutputs["workflowLogs"]["getByWorkflow"]
            >;

            return prevData?.pages[0]?.workflowRuns[0]?.id !== workflowRun.id;
          },
        },
      );

      const workflowPathname = `/workflows/${workflow.id}`;
      if (pathname !== workflowPathname) {
        toast(workflow.name, {
          description: "Just finished running right now",
          action: {
            label: "View",
            onClick: () => {
              router.push(workflowPathname);
            },
          },
          position: "bottom-right",
        });
      }
    }

    channel.bind("in-progress", handleWorkflowInProgress);
    channel.bind("completed", handleWorkflowCompleted);

    return () => {
      channel.unbind("in-progress", handleWorkflowInProgress);
      channel.unbind("completed", handleWorkflowCompleted);
      pusher.unsubscribe(CHANNEL_NAME);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}

export default WorkflowNotifications;
