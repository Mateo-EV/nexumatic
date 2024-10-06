import { Icons } from "@/components/Icons";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ServicesData } from "@/config/const";
import { cn } from "@/lib/utils";
import { type NodeData, useWorkflow } from "@/providers/WorkflowProvider";
import { Settings2Icon } from "lucide-react";
import { useMemo } from "react";
import { Handle, type HandleProps, Position } from "reactflow";
import { ServiceSettings } from "./ServiceSettings";

export function TaskEditorNode({ data }: { data: NodeData }) {
  const Icon = Icons.services[data.service.name];
  const rand = useMemo(() => Math.random(), []);

  const { description } = ServicesData[data.service.name][
    data.service.method as never
  ] as {
    description: string;
  };

  return (
    <div className="animate-fade-in">
      {data.service.type === "action" && (
        <CustomHandle
          type="target"
          position={Position.Top}
          style={{ zIndex: "100" }}
        />
      )}
      <Card className="relative max-w-[400px]">
        <CardHeader className="flex flex-row items-center gap-4">
          <Icon className="size-[30px]" />
          <div>
            <CardTitle className="text-md">{data.service.name}</CardTitle>
            {/* <div>
              <p className="text-xs text-muted-foreground/50">
                <b className="text-muted-foreground/80">ID: </b>
                {nodeId}
              </p> */}
            <p>{description}</p>
            {/* </div> */}
          </div>
        </CardHeader>
        <DropdownMenu>
          <DropdownMenuTrigger className="absolute right-2 top-2 cursor-pointer">
            <Badge variant="secondary">
              <Settings2Icon className="size-4" />
            </Badge>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="center"
            side="right"
            sideOffset={30}
            className="max-w-72"
          >
            <ServiceSettings data={data} />
          </DropdownMenuContent>
        </DropdownMenu>

        <div
          className={cn("absolute left-3 top-4 size-2 rounded-full", {
            "bg-green-500": rand < 0.6,
            "bg-orange-500": rand >= 0.6 && rand < 0.8,
            "bg-red-500": rand >= 0.8,
          })}
        ></div>
      </Card>
      <CustomHandle type="source" position={Position.Bottom} id="b" />
    </div>
  );
}

const CustomHandle = (props: HandleProps & { style?: React.CSSProperties }) => {
  const { editor } = useWorkflow();

  return (
    <Handle
      className="!h-4 !w-4 !bg-primary"
      {...props}
      isValidConnection={(connection) => {
        const targetFromHandleInState = editor.edges.find(
          (edge) => edge.target === connection.target,
        );

        if (targetFromHandleInState) return false;

        return true;
      }}
    />
  );
};
