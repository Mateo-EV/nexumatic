"use client";

import { SubmitButton } from "@/components/ui/button";
import { useWorkflow, type NodeData } from "@/providers/WorkflowProvider";
import { type ServicesMethods } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { ConfigurationSkeleton } from "./configuration/ConfigurationSkeleton";
import { DiscordPostMessage } from "./configuration/DiscordPostMessage";
import { ManualTriggerClickButton } from "./configuration/ManualTriggerClickButton";
import { GoogleDriveListeningFiles } from "./configuration/GoogleDriveListeningFiles";
import { SlackPostMessage } from "./configuration/SlackPostMessage";

export const ServiceSettings = ({ data }: { data: NodeData }) => {
  const {
    data: taskConfiguration,
    isPending: isLoadingConfig,
    error,
  } = api.manageWorkflow.getTaskConfiguration.useQuery(data.id, {
    retry(failureCount, error) {
      if (error.data?.code === "NOT_FOUND") return false;
      return failureCount < 2;
    },
  });

  if (error?.data?.code === "NOT_FOUND") {
    return <SaveButton />;
  }

  if (isLoadingConfig || !taskConfiguration) {
    return <ConfigurationSkeleton />;
  }

  const Configuration = ServicesSpecificConfigurations[data.service.name][
    data.service.method as never
  ] as (props: { task: unknown }) => JSX.Element;

  return <Configuration task={{ ...data, configuration: taskConfiguration }} />;
};

const SaveButton = () => {
  const { editor, workflow, createNewSavedPoint } = useWorkflow();

  const apiUtils = api.useUtils();
  const { mutate: saveDataInWorkflow, isPending } =
    api.manageWorkflow.saveDataInWorkflow.useMutation({
      onSuccess: ({ savedDependencies, savedTasks }) => {
        apiUtils.manageWorkflow.getDataFromWorkflow.setData(
          workflow.id,
          (prev) => {
            if (!prev) return;

            return {
              ...prev,
              tasks: savedTasks.map((t) => ({
                ...t,
                positionX: Number(t.positionX),
                positionY: Number(t.positionY),
              })),
              tasksDependencies: savedDependencies,
            };
          },
        );
        createNewSavedPoint();
        toast.success("Workflow saved successfully");
      },
      onError: () => {
        toast.error("Something went wrong");
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

  return (
    <SubmitButton
      isSubmitting={isPending}
      disabled={submitButtonDisabled}
      variant="outline"
      onClick={handleClick}
      className="w-full"
    >
      Save
    </SubmitButton>
  );
};

const ServicesSpecificConfigurations = {
  Discord: {
    postMessage: DiscordPostMessage,
  },
  "Google Drive": {
    listenFilesAdded: GoogleDriveListeningFiles,
  },
  "Manual Trigger": {
    clickButton: ManualTriggerClickButton,
  },
  Notion: {
    addBlock: () => <div>hola</div>,
  },
  Slack: {
    postMessage: SlackPostMessage,
  },
} as unknown as ServicesMethods<(props: { task: unknown }) => JSX.Element>;
