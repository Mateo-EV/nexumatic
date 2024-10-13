"use client";

import { type NodeData } from "@/providers/WorkflowProvider";
import { type ServicesMethods } from "@/server/db/schema";
import { ManualTriggerClickButton } from "./configuration/ManualTriggerClickButton";
import { api } from "@/trpc/react";
import { ConfigurationSkeleton } from "./configuration/ConfigurationSkeleton";
import { DiscordPostMessage } from "./configuration/DiscordPostMessage";

export const ServiceSettings = ({ data }: { data: NodeData }) => {
  const { data: taskConfiguration, isPending: isLoadingConfig } =
    api.manageWorkflow.getTaskConfiguration.useQuery(data.id);

  if (isLoadingConfig || !taskConfiguration) {
    return <ConfigurationSkeleton />;
  }

  const Configuration = ServicesSpecificConfigurations[data.service.name][
    data.service.method as never
  ] as (props: { task: unknown }) => JSX.Element;

  return <Configuration task={{ ...data, configuration: taskConfiguration }} />;
};

const ServicesSpecificConfigurations = {
  Discord: {
    postMessage: DiscordPostMessage,
  },
  "Google Drive": {
    listenFilesAdded: () => {
      return <div></div>;
    },
  },
  "Manual Trigger": {
    clickButton: ManualTriggerClickButton,
  },
} as unknown as ServicesMethods<(props: { task: unknown }) => JSX.Element>;
