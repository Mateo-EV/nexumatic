"use client";

import { api } from "@/trpc/react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type LogType = "info" | "warning" | "error";

interface LogEntry {
  type: LogType;
  message: string;
}

export const WorkflowLogs = () => {
  const pathname = usePathname();
  const workflowId = useMemo(
    () => pathname.split("/").filter(Boolean).pop()!,
    [pathname],
  );

  const { data, isLoading } = api.workflowLogs.getByWorkflow.useInfiniteQuery(
    { workflowId },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  const [logs] = useState<LogEntry[]>([
    { type: "info", message: "Workflow initalizated" },
    { type: "warning", message: "There is a lack of data" },
    { type: "error", message: "Something went wrong" },
  ]);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  if (isLoading) return "Cargando";

  const workflowRunsData = data?.pages.flatMap((page) => page.workflowRuns);

  const getLogColor = (type: LogType) => {
    switch (type) {
      case "info":
        return "text-blue-400";
      case "warning":
        return "text-yellow-400";
      case "error":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="mx-auto h-full w-full max-w-2xl bg-gray-100 p-4 dark:bg-gray-900">
      <div
        ref={terminalRef}
        className="h-full overflow-y-auto rounded bg-white p-4 font-mono text-sm dark:bg-black"
      >
        {logs.map((log, index) => (
          <div key={index} className={`${getLogColor(log.type)} mb-1`}>
            <span className="text-gray-500">{`[${new Date().toLocaleTimeString()}] `}</span>
            <span className="font-bold">{`${log.type.toUpperCase()}: `}</span>
            {log.message}
          </div>
        ))}
      </div>
    </div>
  );
};
