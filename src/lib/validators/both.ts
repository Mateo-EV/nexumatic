import { array, number, object, string, type z } from "zod";

export const workflowSchema = object({
  name: string().min(1, "Name is required").max(255, "Name too long"),
  description: string().max(255, "Description too long"),
});

export const MAX_TASKS = 20;

export const workflowTasksSchema = object({
  workflowId: string().min(1),
  tasks: array(
    object({
      serviceId: string().min(1),
      tempId: string().min(1),
      position: object({
        x: number(),
        y: number(),
      }),
    }),
  )
    .max(MAX_TASKS)
    .refine((array) => {
      const ids = array.map(({ tempId }) => tempId);
      const uniqueIds = new Set(ids);
      return uniqueIds.size === ids.length;
    }),
  taskDependencies: array(
    object({
      taskTempId: string().min(1),
      taskDependencyTempId: string().min(1),
    }),
  ).max(MAX_TASKS - 1),
}).refine(({ tasks, taskDependencies }) => {
  const taskTempIds = tasks.map(({ tempId }) => tempId);

  const allIdsExist = taskDependencies.every(
    ({ taskTempId, taskDependencyTempId }) =>
      taskTempIds.includes(taskTempId) &&
      taskTempIds.includes(taskDependencyTempId),
  );

  if (!allIdsExist) return false;

  const idPairs = taskDependencies.map(
    ({ taskTempId, taskDependencyTempId }) =>
      `${taskTempId}-${taskDependencyTempId}`,
  );
  const uniquePairs = new Set(idPairs);
  return uniquePairs.size === idPairs.length;
});

export type workflowTasksSchemaType = z.infer<typeof workflowTasksSchema>;
