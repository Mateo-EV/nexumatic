"use client";

import { type Node, useWorkflow } from "@/providers/WorkflowProvider";
import { useCallback, useState } from "react";
import ReactFlow, {
  addEdge,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  type Connection,
  Controls,
  type EdgeChange,
  type Edge as LibEdge,
  MiniMap,
  type NodeChange,
  type ReactFlowInstance,
} from "reactflow";
import { toast } from "sonner";
import { TaskEditorNode } from "./TaskEditorNode";

const onDragOver = (event: React.DragEvent) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
};

const nodeTypes = { Task: TaskEditorNode };

export const WorkflowEditor = () => {
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance>();

  const {
    workflow,
    setNodes,
    setEdges,
    saveToHistory,
    editor,
    services,
    thereIsTrigger,
    setThereIsTrigger,
  } = useWorkflow();

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      //@ts-expect-error Doesn´t have effect
      setEdges((prev) => applyNodeChanges(changes, prev));
      saveToHistory();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [saveToHistory],
  );

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((prev) => {
      const nodes = applyNodeChanges(changes, prev);
      setThereIsTrigger(
        nodes.some((node) => node.data.service.type === "trigger"),
      );
      return nodes;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onConnect = useCallback(
    (edge: LibEdge | Connection) => {
      setEdges((eds) => addEdge(edge, eds));
      saveToHistory();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [saveToHistory],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (!reactFlowInstance) return;
      const serviceId = e.dataTransfer.getData("application/reactflow");
      const service = services.indexedById[serviceId]!;

      if (service.type === "trigger" && thereIsTrigger) {
        toast.error("There cannot be more than one trigger in a workflow");
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      const newId = crypto.randomUUID();

      const newNode = {
        id: newId,
        position,
        type: "Task",
        data: {
          id: newId,
          positionX: position.x,
          positionY: position.y,
          service,
          serviceId: serviceId,
          updatedAt: new Date(),
          workflowId: workflow.id,
          configuration: null,
        },
      } satisfies Node;

      setNodes((prev) => [...prev, newNode]);
      setThereIsTrigger(service.type === "trigger");
      saveToHistory();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reactFlowInstance, saveToHistory, services.indexedById, thereIsTrigger],
  );

  const onNodeDragStop = useCallback(() => {
    saveToHistory();
  }, [saveToHistory]);

  return (
    <div className="flex h-full items-center justify-center">
      <ReactFlow
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodes={editor.nodes}
        onNodesChange={onNodesChange}
        edges={editor.edges}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        nodeTypes={nodeTypes}
        onInit={setReactFlowInstance}
        proOptions={{ hideAttribution: true }}
        onNodeDragStop={onNodeDragStop}
      >
        <Controls position="top-left" />
        <MiniMap
          position="bottom-left"
          className="!bg-background"
          zoomable
          pannable
        />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
};
