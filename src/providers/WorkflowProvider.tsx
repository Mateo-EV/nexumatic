"use client";

import { type ServicesCardTypes } from "@/config/const";
import { type WorkFlow } from "@/server/db/schema";
import { createContext, useCallback, useContext, useState } from "react";
import {
  applyNodeChanges,
  Node as LibNode,
  NodeChange,
  Edge as LibEdge,
  EdgeChange,
} from "reactflow";

const WorkflowContext = createContext({});

type WorkflowProviderProps = {
  children: React.ReactNode;
  workflow: WorkFlow;
  services: {
    id: string;
    name: string;
  }[];
};

export type NodeData = {
  name: string;
  description: string;
  type: keyof typeof ServicesCardTypes;
};

export type Node = LibNode<NodeData, NodeData["type"]>;

export type Edge = LibEdge;

export type Editor = {
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node;
};

export type WorkflowContextProps = {
  workflow: WorkFlow;
  services: {
    id: string;
    name: string;
  }[];
  editor: Editor;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  setSelectedNode: React.Dispatch<React.SetStateAction<Node>>;
};

export const WorkflowProvider = ({
  children,
  workflow,
  services,
}: WorkflowProviderProps) => {
  const [nodes, setNodes] = useState<Node[]>([]);

  const [edges, setEdges] = useState<Edge[]>([]);

  const [selectedNode, setSelectedNode] = useState<Node>({
    id: "",
    data: { name: "", description: "", type: "Discord" },
    position: { x: 0, y: 0 },
  });

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
        } as WorkflowContextProps
      }
    >
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () =>
  useContext(WorkflowContext) as WorkflowContextProps;
