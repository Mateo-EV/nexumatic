"use client";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Separator } from "@/components/ui/separator";
import useWorkflowLog from "@/hooks/useWorkflowLog";
import { formatDateForLogs } from "@/lib/utils";
import { api } from "@/trpc/react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

type LogType = "success" | "warning" | "error";

const getLogColor = (type: LogType) => {
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

export const WorkflowLogs = () => {
  const pathname = usePathname();
  const workflowId = useMemo(
    () => pathname.split("/").filter(Boolean).pop()!,
    [pathname],
  );

  const { data, isLoading } = api.workflowLogs.getByWorkflow.useInfiniteQuery(
    { workflowId },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  useWorkflowLog(workflowId);

  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [data]);

  if (isLoading)
    return (
      <div className="flex w-full items-center justify-center pt-10">
        <LoadingSpinner className="size-10" />
      </div>
    );

  const workflowRunsData = data?.pages.flatMap((page) => page.workflowRuns);

  return (
    <div className="mx-auto w-full max-w-2xl bg-gray-100 p-4 dark:bg-gray-900">
      <div
        ref={terminalRef}
        className="scrollbar relative flex h-[calc(100vh-15.8rem)] flex-col-reverse overflow-y-auto rounded bg-white p-4 font-mono text-sm dark:bg-black"
      >
        {workflowRunsData?.map((workflowRun) => (
          <div key={workflowRun.id}>
            <Separator className="mb-2" />
            <div className="text-blue-500">
              <span className="text-gray-500">{`[${formatDateForLogs(workflowRun.started_at)}] `}</span>
              <span className="font-bold">INFO: </span>
              Workflow execution started
            </div>
            {workflowRun.taskLogs.map((log, index) => (
              <div key={index} className={`${getLogColor(log.status)}`}>
                <span className="text-gray-500">{`[${formatDateForLogs(log.created_at)}] `}</span>
                <span className="font-bold uppercase">{`${log.status}: `}</span>
                {log.logMessage}
              </div>
            ))}
            {workflowRun.completed_at && (
              <div className="text-blue-500">
                <span className="text-gray-500">{`[${formatDateForLogs(workflowRun.completed_at)}] `}</span>
                <span className="font-bold">INFO: </span>
                Workflow execution finished
              </div>
            )}
            <Separator className="mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
};
