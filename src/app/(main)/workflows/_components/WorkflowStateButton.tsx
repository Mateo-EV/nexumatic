"use client";

import { Switch } from "@/components/ui/switch";
import { api } from "@/trpc/react";

type WorkflowStateButtonProps = {
  isActive?: boolean;
  workflowId: string;
};

export const WorkflowStateButton = ({
  isActive,
  workflowId,
}: WorkflowStateButtonProps) => {
  const { data } = api.workflow.getIsActive.useQuery(workflowId, {
    initialData: isActive,
  });
  const apiUtils = api.useUtils();
  const { mutate: updateIsActive } = api.workflow.updateIsActive.useMutation({
    onMutate: () => {
      void apiUtils.workflow.getIsActive.cancel();

      const prevIsActive = apiUtils.workflow.getIsActive.getData(workflowId);

      apiUtils.workflow.getIsActive.setData(workflowId, (prev) => {
        if (prev === undefined) return;

        return !prev;
      });

      return { prevIsActive };
    },
    onError: (_, __, context) => {
      if (context?.prevIsActive) {
        apiUtils.workflow.getIsActive.setData(workflowId, context.prevIsActive);
      }
    },
  });

  return (
    <Switch
      className="ml-2"
      checked={data}
      onCheckedChange={(isActive) => {
        updateIsActive({ workflowId, isActive });
      }}
      style={{
        viewTransitionName: `workflow-switch-activity-${workflowId}`,
      }}
    />
  );
};
