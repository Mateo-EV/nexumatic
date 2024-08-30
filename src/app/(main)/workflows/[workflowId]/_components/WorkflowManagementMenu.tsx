"use client";

import { Icons } from "@/components/Icons";
import { Button, SubmitButton } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServicesData } from "@/config/const";
import { useWorkflow } from "@/providers/WorkflowProvider";
import { type ServiceClient } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { useEffect, useState } from "react";

export const WorkflowManagementMenu = () => {
  const { thereIsTrigger, editor, workflow } = useWorkflow();

  const { mutate: saveDataInWorkflow, isPending } =
    api.manageWorkflow.saveDataInWorkflow.useMutation({
      // onMutate: () => {},
    });

  const handleClick = () => {
    saveDataInWorkflow({
      workflowId: workflow.id,
      tasks: editor.nodes.map(
        ({ id: tempId, data: { id: serviceId }, position }) => ({
          serviceId,
          tempId,
          details: {
            position,
          },
        }),
      ),
      taskDependencies: editor.edges.map(({ source, target }) => ({
        taskTempId: target,
        taskDependencyTempId: source,
      })),
    });
  };

  return (
    <>
      <div className="flex w-full gap-2 border-b p-4 [&>button]:flex-1">
        <Button
          disabled={!thereIsTrigger}
          className={thereIsTrigger ? "glow-on-hover" : undefined}
        >
          Trigger
        </Button>
        <SubmitButton
          isSubmitting={isPending}
          variant="secondary"
          disabled={editor.nodes.length === 0}
          onClick={handleClick}
        >
          Save
        </SubmitButton>
      </div>
      <WorkflowManagementMenuTasks />
    </>
  );
};

const WorkflowManagementMenuTasks = () => {
  const { services, thereIsTrigger } = useWorkflow();
  const [tabActive, setTabActive] = useState<"triggers" | "actions">(
    "triggers",
  );

  useEffect(() => {
    if (thereIsTrigger) {
      setTabActive("actions");
    }
  }, [thereIsTrigger]);

  return (
    <Tabs
      value={tabActive}
      //@ts-expect-error no error
      onValueChange={setTabActive}
    >
      <TabsList className="grid w-full grid-cols-2 rounded-none">
        <TabsTrigger value="triggers" disabled={thereIsTrigger}>
          Triggers
        </TabsTrigger>
        <TabsTrigger value="actions">Actions</TabsTrigger>
      </TabsList>
      <TabsContent value="triggers">
        <div className="flex flex-col gap-4 p-4">
          {services.indexedByType.triggers.map((service) => (
            <TasksServicesCard key={service.id} {...service} />
          ))}
        </div>
      </TabsContent>
      <TabsContent value="actions">
        <div className="flex flex-col gap-4 p-4">
          {services.indexedByType.actions.map((service) => (
            <TasksServicesCard key={service.id} {...service} />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
};

const onDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
  e.dataTransfer.setData("application/reactflow", id);
  e.dataTransfer.effectAllowed = "move";
};

const TasksServicesCard = ({ id, name, method }: ServiceClient) => {
  const Icon = Icons.services[name];
  const { description } = ServicesData[name][method as never] as {
    description: string;
  };

  return (
    <Card
      draggable
      className="w-full cursor-grab"
      onDragStart={(e) => onDragStart(e, id)}
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
};
