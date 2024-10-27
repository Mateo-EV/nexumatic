import { api, type RouterInputs } from "@/trpc/react";
import { toast } from "sonner";

export const useUpdateTaskConfig = (
  taskId: string,
  method: keyof RouterInputs["taskConfiguration"] = "updateManualTriggerClickButtonConfiguration",
) => {
  const apiUtils = api.useUtils();
  const { mutate, isPending: isUpdatingConfiguration } = api.taskConfiguration[
    method
  ].useMutation({
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
  });

  return {
    updateConfiguration: (
      configuration: RouterInputs["taskConfiguration"][typeof method]["configuration"],
      //@ts-expect-error nothing
    ) => mutate({ taskId, configuration }),
    isUpdatingConfiguration,
  };
};
