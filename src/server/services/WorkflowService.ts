import { type workflowTasksSchemaType } from "@/lib/validators";
import { and, eq } from "drizzle-orm";
import { type Session } from "next-auth";
import "server-only";
import { db } from "../db";
import { connections, services, tasks, type WorkFlow } from "../db/schema";
import { ExternalServices } from "./External";

const taskSelect = {
  id: tasks.id,
  createdAt: tasks.createdAt,
  updatedAt: tasks.updatedAt,
  serviceId: tasks.serviceId,
  workflowId: tasks.workflowId,
  details: tasks.details,
};

export class WorkflowService {
  private workflow: WorkFlow;
  private session: Session = null!;

  constructor(workflow: WorkFlow) {
    this.workflow = workflow;
  }

  public setSession(session: Session) {
    this.session = session;
  }

  private async getInitialTask() {
    const [task] = await db
      .select(taskSelect)
      .from(tasks)
      .leftJoin(services, eq(services.id, tasks.serviceId))
      .where(
        and(
          eq(services.type, "trigger"),
          eq(tasks.workflowId, this.workflow.id),
        ),
      );

    return task ?? null;
  }

  private async getTasksWithDependencies() {
    const tasksWithDependencies = await db.query.tasks.findMany({
      where: eq(tasks.workflowId, this.workflow.id),
      with: {
        dependents: {
          columns: { taskId: true },
        },
        service: {
          columns: { name: true, method: true, type: true },
          with: {
            connections: {
              where: eq(connections.userId, this.session.user.id),
              limit: 1,
            },
          },
        },
      },
    });

    console.log(tasksWithDependencies);

    const isThereLackOfConnections = tasksWithDependencies
      .filter((task) => task.service.type !== "trigger")
      .some((task) => task.service.connections.length === 0);

    if (isThereLackOfConnections) {
      throw new WorkFlowServiceError("There is a lack of connections");
    }

    return tasksWithDependencies;
  }

  private async getWorkflowData() {
    const initialTask = await this.getInitialTask();

    if (!initialTask)
      throw new WorkFlowServiceError(
        "This workflow doesn't have an initial task",
      );

    const tasksWithDependencies = await this.getTasksWithDependencies();

    const tasks = tasksWithDependencies.reduce<
      Record<string, (typeof tasksWithDependencies)[number]>
    >((acc, curr) => {
      acc[curr.id] = curr;
      return acc;
    }, {});

    return { initialTrigger: initialTask, tasks };
  }

  private executeTask = async (
    task: Awaited<ReturnType<typeof this.getTasksWithDependencies>>[number],
  ) => {
    try {
      const service = task.service;
      const serviceExternal = ExternalServices[service.name];

      const methodToExecute = serviceExternal[service.method as never] as (
        t: (typeof task.service.connections)[number],
      ) => Promise<void>;

      await methodToExecute(task.service.connections[0]!);
    } catch (error) {
      console.log(error);
    }
  };

  public async executeWorkflow() {
    const { initialTrigger, tasks } = await this.getWorkflowData();

    console.log("Iniciando Flujo de trabajo completado.");

    const completedTasks = new Set<string>([initialTrigger.id]);

    const inititalTask = tasks[initialTrigger.id]!;

    const executeCurrentTask = this.executeTask;

    async function continueTask(task = inititalTask) {
      if (!task.dependents) return;

      await Promise.all(
        task.dependents.map(async ({ taskId: currentTaskId }) => {
          if (completedTasks.has(currentTaskId)) return;

          const currentTask = tasks[currentTaskId]!;

          await executeCurrentTask(currentTask);

          completedTasks.add(currentTaskId);

          await continueTask(currentTask);
        }),
      );
    }

    await continueTask();

    console.log("Flujo de trabajo completado.");
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

  // public async workflowIsReadyToRun() {

  // }
}

export class WorkFlowServiceError extends Error {
  constructor(message: string) {
    super(message);
  }
}
