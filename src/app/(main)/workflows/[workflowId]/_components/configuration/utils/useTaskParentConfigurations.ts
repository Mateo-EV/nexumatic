"use client";

import { ServicesStringSelector } from "@/config/const";
import { type Edge, useWorkflow } from "@/providers/WorkflowProvider";
import { api } from "@/trpc/react";
import { useMemo } from "react";

function getParentTasks(taskId: string, edges: Edge[]) {
  const parentNodes = new Set<string>();
  const stack = [taskId];

  while (stack.length > 0) {
    const actual = stack.pop()!;

    for (const edge of edges) {
      if (edge.target === actual) {
        const parent = edge.source;
        if (!parentNodes.has(parent)) {
          parentNodes.add(parent);
          stack.push(parent);
        }
      }
    }
  }

  return Array.from(parentNodes);
}

export function useTaskParentsConfiguration(taskId: string) {
  const {
    editor: { edges },
  } = useWorkflow();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const parentNodes = useMemo(() => getParentTasks(taskId, edges), [edges]);

  const configurations = api.useQueries((t) =>
    parentNodes.map((id) => t.manageWorkflow.getTaskConfiguration(id)),
  );

  return {
    isLoading: configurations.some(({ isPending, data }) => isPending || !data),
    queries: configurations,
  };
}

export function useTaskParentsConfigurationStringSelector(taskId: string) {
  const {
    editor: { edges, nodes },
  } = useWorkflow();

  const serviceSelectors = useMemo(() => {
    const parentTasks = getParentTasks(taskId, edges);
    const nodesFiltered = nodes.filter((node) => parentTasks.includes(node.id));

    return nodesFiltered.flatMap(({ data }) => {
      return ServicesStringSelector[data.service.name][
        data.service.method as never
      ];
    }) as { value: string; name: string }[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edges]);

  return serviceSelectors;
}
