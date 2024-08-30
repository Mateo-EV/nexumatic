"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { type getAvailableServicesForUser } from "@/server/db/data";
import { type ServiceClient, type WorkFlow } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { createContext, useContext, useEffect, useState } from "react";
import { type Edge as LibEdge, type Node as LibNode } from "reactflow";

const WorkflowContext = createContext({});

type WorkflowProviderProps = {
  children: React.ReactNode;
  workflow: WorkFlow;
  services: Awaited<ReturnType<typeof getAvailableServicesForUser>>;
};
export type Node = LibNode<ServiceClient>;

export type Edge = LibEdge;

export type Editor = {
  nodes: Node[];
  edges: Edge[];
  selectedNode?: Node;
};

export type WorkflowContextProps = {
  workflow: WorkFlow;
  services: Awaited<ReturnType<typeof getAvailableServicesForUser>>;
  editor: Editor;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  setSelectedNode: React.Dispatch<React.SetStateAction<Node>>;
  thereIsTrigger: boolean;
  setThereIsTrigger: React.Dispatch<React.SetStateAction<boolean>>;
};

export const WorkflowProvider = ({
  children,
  workflow,
  services,
}: WorkflowProviderProps) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const [selectedNode, setSelectedNode] = useState<Node>();

  const [thereIsTrigger, setThereIsTrigger] = useState(false);

  const { data: workflowData, isPending } =
    api.manageWorkflow.getDataFromWorkflow.useQuery(workflow.id);

  useEffect(() => {
    if (!workflowData) return;

    let thereIsTrigger = false;

    const nodes: Node[] = workflowData.tasks.map(
      ({ id, serviceId, taskDetails }) => {
        const service = services.indexedById[serviceId]!;

        if (service.type === "trigger") {
          thereIsTrigger = true;
        }

        return {
          id,
          type: "Task",
          position: {
            x: taskDetails?.position.x ?? 0,
            y: taskDetails?.position.y ?? 0,
          },
          data: service,
        };
      },
    );

    const edges: Edge[] = workflowData.tasksDependencies.map(
      ({ taskId, dependsOnTaskId }) => ({
        id: `reactflow__edge-${dependsOnTaskId}-${taskId}`,
        source: dependsOnTaskId,
        target: taskId,
        sourceHandle: "b",
        targetHandle: null,
      }),
    );

    setThereIsTrigger(thereIsTrigger);

    const timeOut = setTimeout(() => {
      setNodes(nodes);
      setEdges(edges);
    }, 300);

    return () => {
      clearTimeout(timeOut);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowData]);

  if (isPending) {
    return (
      <div className="grid h-full w-full grid-cols-[1fr_3fr_1fr] grid-rows-2 gap-8 p-8">
        <Skeleton className="row-span-2" />
        <Skeleton className="row-span-2" />
        <Skeleton />
        <Skeleton />
      </div>
    );
  }

  return (
    <WorkflowContext.Provider
      value={
        {
          workflow,
          services,
          editor: { nodes, edges, selectedNode },
          setNodes,
          setEdges,
          setSelectedNode,
          thereIsTrigger,
          setThereIsTrigger,
        } as WorkflowContextProps
      }
    >
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () =>
  useContext(WorkflowContext) as WorkflowContextProps;
