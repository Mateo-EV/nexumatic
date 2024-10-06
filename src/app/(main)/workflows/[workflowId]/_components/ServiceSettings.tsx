"use client";

import { type NodeData } from "@/providers/WorkflowProvider";
import { type ServicesMethods } from "@/server/db/schema";
import { ManualTriggerClickButton } from "./configuration/ManualTriggerClickButton";

export const ServiceSettings = ({ data }: { data: NodeData }) => {
  const Configuration = ServicesSpecificConfigurations[data.service.name][
    data.service.method as never
  ] as (props: { data: NodeData }) => JSX.Element;

  return <Configuration data={data} />;
};

const ServicesSpecificConfigurations = {
  Discord: {
    postMessage: () => {
      return <div></div>;
    },
  },
  "Google Drive": {
    listenFilesAdded: () => {
      return <div></div>;
    },
  },
  "Manual Trigger": {
    clickButton: ManualTriggerClickButton,
  },
} as unknown as ServicesMethods<(props: { data: NodeData }) => JSX.Element>;
