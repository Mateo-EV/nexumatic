"use client";

import { Icons } from "@/components/Icons";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ServicesCardTypes } from "@/config/const";
import { cn } from "@/lib/utils";
import {
  type Node,
  useWorkflow,
  type NodeData,
} from "@/providers/WorkflowProvider";
import { useCallback, useMemo, useState } from "react";
import ReactFlow, {
  applyNodeChanges,
  Background,
  BackgroundVariant,
  Controls,
  type Edge as LibEdge,
  type EdgeChange,
  Handle,
  type HandleProps,
  MiniMap,
  type NodeChange,
  Position,
  type ReactFlowInstance,
  useNodeId,
  type Connection,
  addEdge,
} from "reactflow";

const onDragOver = (event: React.DragEvent) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
};

const nodeTypes = {
  "Google Drive": TaskEditorNode,
  Discord: TaskEditorNode,
};

export const WorkflowEditor = () => {
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance>();

  const { setNodes, setEdges, setSelectedNode, editor } = useWorkflow();

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    //@ts-expect-error Doesn´t have effect
    setEdges((prev) => applyNodeChanges(changes, prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    //@ts-expect-error Doesn´t have effect
    setNodes((prev) => applyNodeChanges(changes, prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onConnect = useCallback(
    (edge: LibEdge | Connection) => setEdges((eds) => addEdge(edge, eds)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!reactFlowInstance) return;
    const type = e.dataTransfer.getData(
      "application/reactflow",
    ) as NodeData["type"];

    const position = reactFlowInstance.screenToFlowPosition({
      x: e.clientX,
      y: e.clientY,
    });

    const newNode = {
      id: crypto.randomUUID(),
      position,
      type,
      data: {
        name: type,
        type,
        description: ServicesCardTypes[type].description,
      },
    } satisfies Node;

    setNodes((prev) => [...prev, newNode]);
  };

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

function TaskEditorNode({ data }: { data: NodeData }) {
  const Icon = Icons.services[data.type];
  const nodeId = useNodeId();
  const rand = useMemo(() => Math.random(), []);

  return (
    <>
      <CustomHandle
        type="target"
        position={Position.Top}
        style={{ zIndex: "100" }}
      />
      <Card className="relative max-w-[400px]">
        <CardHeader className="flex flex-row items-center gap-4">
          <Icon className="size-[30px]" />
          <div>
            <CardTitle className="text-md">{data.name}</CardTitle>
            <div>
              <p className="text-xs text-muted-foreground/50">
                <b className="text-muted-foreground/80">ID: </b>
                {nodeId}
              </p>
              <p>{data.description}</p>
            </div>
          </div>
        </CardHeader>
        <Badge variant="secondary" className="absolute right-2 top-2">
          {data.type}
        </Badge>
        <div
          className={cn("absolute left-3 top-4 h-2 w-2 rounded-full", {
            "bg-green-500": rand < 0.6,
            "bg-orange-500": rand >= 0.6 && rand < 0.8,
            "bg-red-500": rand >= 0.8,
          })}
        ></div>
      </Card>
      <CustomHandle type="source" position={Position.Bottom} />
    </>
  );
}

const CustomHandle = (props: HandleProps & { style?: React.CSSProperties }) => {
  return <Handle className="!h-4 !w-4 !bg-primary" {...props} />;
};
