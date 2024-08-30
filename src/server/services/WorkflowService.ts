import "server-only";
import { taskDependencies, tasks, type WorkFlow } from "../db/schema";
import { db } from "../db";
import { and, eq, isNull } from "drizzle-orm";
import { type workflowTasksSchemaType } from "@/lib/validators";

const taskSelect = {
  id: tasks.id,
  createdAt: tasks.createdAt,
  updatedAt: tasks.updatedAt,
  serviceId: tasks.serviceId,
  workflowId: tasks.workflowId,
  taskDetails: tasks.taskDetails,
};

export class WorkflowService {
  workflow: WorkFlow;

  constructor(workflow: WorkFlow) {
    this.workflow = workflow;
  }

  private async getInitialTask() {
    const [task] = await db
      .select(taskSelect)
      .from(tasks)
      .leftJoin(taskDependencies, eq(taskDependencies.taskId, tasks.id))
      .where(
        and(
          isNull(taskDependencies.dependsOnTaskId),
          eq(tasks.workflowId, this.workflow.id),
        ),
      );

    return task ?? null;
  }

  private async getTasksWithDependencies() {
    return await db
      .select({ ...taskSelect, dependencies: taskDependencies.dependsOnTaskId })
      .from(tasks)
      .leftJoin(taskDependencies, eq(taskDependencies.taskId, tasks.id))
      .where(eq(tasks.workflowId, this.workflow.id));
  }

  // private async getTasksIndexedById(tasksWithDependencies: Awaited<ReturnType<typeof this.getTasksWithDependencies>>) {
  //   const tasks = tasksWithDependencies.reduce((acc, task) => {
  //     acc[task.id] = {
  //       ...task,
  //       dependencies:
  //     }
  //   }, {})
  // }

  private async getWorkflowData() {
    const initialTask = await this.getInitialTask();

    if (!initialTask)
      throw new WorkFlowServiceError(
        "This workflow doesn't have an initial task",
      );

    const tasksWithDependencies = await this.getTasksWithDependencies();

    console.log(tasksWithDependencies);
  }

  public async executeWorkflow() {
    await this.getWorkflowData();
  }

  public static validateDependencies(
    taskDependencies: workflowTasksSchemaType["taskDependencies"],
  ) {
    const adjacencyList = taskDependencies.reduce(
      (acc, { taskTempId, taskDependencyTempId }) => {
        if (!acc[taskDependencyTempId]) acc[taskDependencyTempId] = [];
        acc[taskDependencyTempId].push(taskTempId);
        return acc;
      },
      {} as Record<string, string[]>,
    );

    const childToParentMap = new Map();
    for (const { taskTempId, taskDependencyTempId } of taskDependencies) {
      if (childToParentMap.has(taskTempId)) {
        return false;
      }
      childToParentMap.set(taskTempId, taskDependencyTempId);
    }

    const hasCycle = (
      taskDependencyTempId: string,
      visited = new Set(),
      stack = new Set(),
    ) => {
      if (stack.has(taskDependencyTempId)) return true;
      if (visited.has(taskDependencyTempId)) return false;

      visited.add(taskDependencyTempId);
      stack.add(taskDependencyTempId);

      const neighbourTasks = adjacencyList[taskDependencyTempId] ?? [];

      for (const neighbour of neighbourTasks) {
        if (hasCycle(neighbour, visited, stack)) return true;
      }

      stack.delete(taskDependencyTempId);
      return false;
    };

    const allTasks = Object.keys(adjacencyList);
    for (const task of allTasks) {
      if (hasCycle(task)) {
        return false;
      }
    }

    return true;
  }
}

export class WorkFlowServiceError extends Error {
  constructor(message: string) {
    super(message);
  }
}
