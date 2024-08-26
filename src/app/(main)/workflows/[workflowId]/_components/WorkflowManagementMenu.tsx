"use client";

import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ServicesCardTypes } from "@/config/const";
import { useWorkflow } from "@/providers/WorkflowProvider";

export const WorkflowManagementMenu = () => {
  return (
    <>
      <div className="flex w-full gap-2 border-b p-4 [&>button]:flex-1">
        <Button variant="secondary">Trigger</Button>
        <Button>Publish</Button>
      </div>
      <WorkflowManagementMenuActions />
    </>
  );
};

const onDragStart = (e: React.DragEvent<HTMLDivElement>, name: string) => {
  e.dataTransfer.setData("application/reactflow", name);
  e.dataTransfer.effectAllowed = "move";
};

const WorkflowManagementMenuActions = () => {
  const { services } = useWorkflow();

  return (
    <div className="flex flex-col gap-4 p-4">
      {services.map(({ id, name }) => {
        const Icon = Icons.services[name as keyof typeof Icons.services];
        const description =
          ServicesCardTypes[name as keyof typeof ServicesCardTypes].description;

        return (
          <Card
            key={id}
            draggable
            className="w-full cursor-grab"
            onDragStart={(e) => onDragStart(e, name)}
          >
            <CardHeader className="flex flex-row items-center gap-4 p-4">
              <Icon className="size-[30px] shrink-0" />
              <CardTitle className="text-md">
                {name}
                <CardDescription>{description}</CardDescription>
              </CardTitle>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
};
