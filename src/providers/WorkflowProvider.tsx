"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { type getAvailableServicesForUser } from "@/server/db/data";
import {
  type ServiceClient,
  type Task,
  type WorkFlow,
} from "@/server/db/schema";
import { api } from "@/trpc/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { type Edge as LibEdge, type Node as LibNode } from "reactflow";

const WorkflowContext = createContext({});

type WorkflowProviderProps = {
  children: React.ReactNode;
  workflow: WorkFlow;
  services: Awaited<ReturnType<typeof getAvailableServicesForUser>>;
};

export type NodeData = Omit<Task, "configuration"> & {
  service: ServiceClient;
};

export type Node = LibNode<NodeData>;

export type Edge = LibEdge;

export type Editor = {
  nodes: Node[];
  edges: Edge[];
  selectedNode?: Node;
  history: {
    nodes: Node[];
    edges: Edge[];
    saved?: boolean;
  }[];
};

export type WorkflowContextProps = {
  workflow: WorkFlow;
  services: Awaited<ReturnType<typeof getAvailableServicesForUser>>;
  editor: Editor;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  setSelectedNode: React.Dispatch<React.SetStateAction<Node>>;
  saveToHistory: () => void;
  createNewSavedPoint: () => void;
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
  const [history, setHistory] = useState<Editor["history"]>([]);
  const [redoStack, setRedoStack] = useState<Editor["history"]>([]);

  const { data: workflowData, isPending } =
    api.manageWorkflow.getDataFromWorkflow.useQuery(workflow.id);

  const saveToHistory = useCallback(() => {
    setHistory((prevHistory) => [
      ...prevHistory,
      { nodes: [...nodes], edges: [...edges] },
    ]);
  }, [nodes, edges]);

  const createNewSavedPoint = useCallback(() => {
    setHistory((prevHistory) => [
      ...prevHistory.slice(0, -1).map(({ edges, nodes }) => ({ edges, nodes })),
      { ...prevHistory[prevHistory.length - 1]!, saved: true },
    ]);
  }, []);

  const undo = useCallback(() => {
    if (history.length > 1) {
      const lastState = history[history.length - 1]!;
      const newActualState = history[history.length - 2]!;
      setRedoStack((prevRedo) => [
        ...prevRedo,
        { ...lastState, nodes: [...nodes], edges: [...edges] },
      ]);
      setNodes(newActualState.nodes);
      setEdges(newActualState.edges);
      setHistory((prevHistory) => prevHistory.slice(0, -1));
    }
  }, [history, nodes, edges]);

  const redo = useCallback(() => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1]!;
      setHistory((prevHistory) => [
        ...prevHistory,
        { ...nextState, nodes: [...nodes], edges: [...edges] },
      ]);
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setRedoStack((prevRedo) => prevRedo.slice(0, -1));
    }
  }, [redoStack, nodes, edges]);

  useEffect(() => {
    let isExecuting = false;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && !isExecuting) {
        isExecuting = true;
        if (event.key === "z") {
          undo();
        } else if (event.key === "y") {
          redo();
        }
        isExecuting = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  useEffect(() => {
    if (!workflowData) return;

    let thereIsTrigger = false;

    const nodes: Node[] = workflowData.tasks.map((task) => {
      const service = services.indexedById[task.serviceId]!;

      if (service.type === "trigger") {
        thereIsTrigger = true;
      }

      return {
        id: task.id,
        type: "Task",
        position: {
          x: task.positionX ?? 0,
          y: task.positionY ?? 0,
        },
        data: {
          service,
          ...task,
        },
      };
    });

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
      if (history.length === 0) {
        setHistory([{ nodes: [...nodes], edges: [...edges], saved: true }]);
      }
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
          editor: { nodes, edges, selectedNode, history },
          setNodes,
          setEdges,
          setSelectedNode,
          saveToHistory,
          createNewSavedPoint,
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
