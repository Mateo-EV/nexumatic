import { type workflowTasksSchemaType } from "@/lib/validators/both";
import { and, eq } from "drizzle-orm";
import { type Session } from "next-auth";
import "server-only";
import { db } from "../db";
import {
  Connection,
  connections,
  Service,
  services,
  TaskConfiguration,
  TaskFile,
  taskFiles,
  tasks,
  type WorkFlow,
} from "../db/schema";
import { ExternalServices } from "./External";

const taskSelect = {
  id: tasks.id,
  updatedAt: tasks.updatedAt,
  serviceId: tasks.serviceId,
  workflowId: tasks.workflowId,
  configuration: tasks.configuration,
  service: services,
  files: taskFiles,
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

  private configurationTasksData: Record<string, string> = {};

  private async getInitialTask() {
    const result = await db
      .select(taskSelect)
      .from(tasks)
      .leftJoin(services, eq(services.id, tasks.serviceId))
      .leftJoin(taskFiles, eq(taskFiles.taskId, tasks.id))
      .where(
        and(
          eq(services.type, "trigger"),
          eq(tasks.workflowId, this.workflow.id),
        ),
      );

    const currentTask = result[0];

    if (!currentTask) return null;

    const files = result.map((r) => r.files);

    return {
      id: currentTask.id,
      updatedAt: currentTask.updatedAt,
      serviceId: currentTask.serviceId,
      workflowId: currentTask.workflowId,
      configuration: currentTask.configuration,
      service: currentTask.service,
      files,
    };
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
        files: true,
      },
    });

    tasksWithDependencies.forEach(({ files }) => {
      files.forEach((f) => {
        this.configurationTasksData[`files.${f.id}`] = f.fileUrl;
      });
    });

    const isThereLackOfConnections = tasksWithDependencies
      .filter((task) => task.service.type !== "trigger")
      .some((task) => task.service.connections.length === 0);

    if (isThereLackOfConnections) {
      throw new WorkFlowServiceError("Asure all your services are connected");
    }

    const allOfThemHasConfig = tasksWithDependencies.every((t) =>
      Boolean(t.configuration),
    );

    if (!allOfThemHasConfig)
      throw new WorkFlowServiceError("Configurate all your tasks");

    return tasksWithDependencies;
  }

  private saveConfigurationData(task: {
    id: string;
    updatedAt: Date;
    serviceId: string;
    workflowId: string;
    configuration: TaskConfiguration | null;
    service: Service | null;
  }) {
    if (!task.configuration || !task.service) return;

    if (task.service.name === "Manual Trigger") {
      if (task.service.method === "clickButton") {
        this.configurationTasksData["manual.content"] =
          task.configuration.content ?? "";
      }
    }
  }

  private async getWorkflowData() {
    const initialTask = await this.getInitialTask();

    if (!initialTask)
      throw new WorkFlowServiceError(
        "This workflow doesn't have an initial task",
      );

    this.saveConfigurationData(initialTask);

    initialTask.files.forEach((f) => {
      if (f) {
        this.configurationTasksData[`files.${f.id}`] = f.fileUrl;
      }
    });

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

      const methodToExecute = serviceExternal[service.method as never] as (t: {
        connection: Connection;
        configuration: TaskConfiguration;
        configurationTasksData: Record<string, string>;
        files: TaskFile[];
      }) => Promise<void>;

      await methodToExecute({
        connection: task.service.connections[0]!,
        configuration: task.configuration!,
        configurationTasksData: this.configurationTasksData,
        files: task.files,
      });
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
}

export class WorkFlowServiceError extends Error {
  constructor(message: string) {
    super(message);
  }
}
