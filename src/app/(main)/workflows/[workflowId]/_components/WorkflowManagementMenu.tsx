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
import { CircleIcon, PlayIcon, SaveAllIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const WorkflowManagementMenu = () => {
  const { thereIsTrigger, editor, workflow, createNewSavedPoint } =
    useWorkflow();

  const { mutate: saveDataInWorkflow, isPending } =
    api.manageWorkflow.saveDataInWorkflow.useMutation({
      // onMutate: () => {},
      onSuccess: () => {
        createNewSavedPoint();
        toast.success("Workflow saved successfully");
      },
    });

  const handleClick = () => {
    saveDataInWorkflow({
      workflowId: workflow.id,
      tasks: editor.nodes.map(
        ({ id: tempId, data: { serviceId }, position }) => ({
          serviceId,
          tempId,
          position,
        }),
      ),
      taskDependencies: editor.edges.map(({ source, target }) => ({
        taskTempId: target,
        taskDependencyTempId: source,
      })),
    });
  };

  const submitButtonDisabled =
    editor.nodes.length === 0 ||
    editor.history[editor.history.length - 1]?.saved;

  const canBeTriggered =
    submitButtonDisabled &&
    editor.nodes.some((node) => node.data.service.name === "Manual Trigger");

  const { mutate: triggerWorkflow, isPending: isWorkflowTriggering } =
    api.manageWorkflow.triggerWorkflow.useMutation();

  return (
    <>
      <div className="flex w-full gap-2 border-b p-4">
        <SubmitButton
          isSubmitting={isPending}
          disabled={submitButtonDisabled}
          variant="outline"
          onClick={handleClick}
        >
          <SaveAllIcon className="size-4" />
        </SubmitButton>

        {thereIsTrigger && (
          <Button
            className={
              isWorkflowTriggering
                ? undefined
                : canBeTriggered
                  ? "glow-on-hover"
                  : undefined
            }
            onClick={() => triggerWorkflow(workflow.id)}
            variant={isWorkflowTriggering ? "destructive" : "default"}
            disabled={isWorkflowTriggering}
          >
            {isWorkflowTriggering ? (
              <CircleIcon className="size-4 fill-current" />
            ) : (
              <PlayIcon className="size-4 fill-current" />
            )}
          </Button>
        )}
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
