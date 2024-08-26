import "server-only";
import { taskDependencies, tasks, type WorkFlow } from "../db/schema";
import { db } from "../db";
import { and, eq, isNull } from "drizzle-orm";

const taskSelect = {
  id: tasks.id,
  createdAt: tasks.createdAt,
  updatedAt: tasks.updatedAt,
  serviceId: tasks.serviceId,
  workflowId: tasks.workflowId,
  taskType: tasks.taskType,
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
}

export class WorkFlowServiceError extends Error {
  constructor(message: string) {
    super(message);
  }
}
