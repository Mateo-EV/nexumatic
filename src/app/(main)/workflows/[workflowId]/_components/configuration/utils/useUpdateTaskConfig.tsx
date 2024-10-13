import { type TaskConfiguration } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { toast } from "sonner";

export const useUpdateTaskConfig = (taskId: string) => {
  const apiUtils = api.useUtils();
  const { mutate, isPending: isUpdatingConfiguration } =
    api.taskConfiguration.updateManualTriggerClickButtonConfiguration.useMutation(
      {
        onError: () => {
          toast.error("Something went wrong");
        },
        onSuccess: async (config) => {
          await apiUtils.manageWorkflow.getTaskConfiguration.cancel(taskId);

          apiUtils.manageWorkflow.getTaskConfiguration.setData(
            taskId,
            (prevData) => {
              if (!prevData) return;

              return {
                ...prevData,
                ...config,
              };
            },
          );

          void apiUtils.manageWorkflow.getTaskConfiguration.invalidate(taskId, {
            predicate: ({ state }) => !state.data,
          });
        },
      },
    );

  return {
    updateConfiguration: (config: TaskConfiguration) =>
      mutate({ taskId, ...config }),
    isUpdatingConfiguration,
  };
};
