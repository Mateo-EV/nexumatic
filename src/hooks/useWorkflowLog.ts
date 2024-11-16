"use client";

import { pusher } from "@/lib/pusher/client";
import { type TaskLog } from "@/server/db/schema";
import { api, type RouterOutputs } from "@/trpc/react";
import { type InfiniteData } from "@tanstack/react-query";
import { useEffect } from "react";

export default function useWorkflowLog(workflowId: string) {
  const apiUtils = api.useUtils();

  useEffect(() => {
    const CHANNEL_NAME = `workflow-${workflowId}`;
    const channel = pusher.subscribe(CHANNEL_NAME);

    async function handleTaskLogCreated(data: TaskLog[]) {
      const taskLogs = data.map((t) => ({
        ...t,
        created_at: new Date(t.created_at),
      }));

      await apiUtils.workflowLogs.getByWorkflow.cancel({ workflowId });

      apiUtils.workflowLogs.getByWorkflow.setInfiniteData(
        { workflowId },
        (prev) => {
          if (!prev?.pages[0]?.workflowRuns[0]) return;

          if (prev.pages[0].workflowRuns[0].completed_at) return;

          return {
            pageParams: prev.pageParams,
            pages: [
              {
                ...prev.pages[0],
                workflowRuns: [
                  {
                    ...prev.pages[0].workflowRuns[0],
                    taskLogs: [
                      ...prev.pages[0].workflowRuns[0].taskLogs,
                      ...taskLogs,
                    ],
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
        { workflowId },
        {
          predicate: (q) => {
            const prevData = q.state.data as unknown as InfiniteData<
              RouterOutputs["workflowLogs"]["getByWorkflow"]
            >;

            return Boolean(
              !prevData?.pages[0]?.workflowRuns[0] ||
                prevData.pages[0].workflowRuns[0].completed_at,
            );
          },
        },
      );
    }

    channel.bind("tak-log-created", handleTaskLogCreated);

    return () => {
      channel.unbind("tak-log-created", handleTaskLogCreated);
      pusher.unsubscribe(CHANNEL_NAME);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
