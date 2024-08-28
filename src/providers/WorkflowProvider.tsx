"use client";

import { type getAvailableServicesForUser } from "@/server/db/data";
import { type ServiceClient, type WorkFlow } from "@/server/db/schema";
import { createContext, useContext, useState } from "react";
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
