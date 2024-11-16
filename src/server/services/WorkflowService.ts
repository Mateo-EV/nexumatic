import { type workflowTasksSchemaType } from "@/lib/validators/both";
import { and, eq } from "drizzle-orm";
import "server-only";
import { db } from "../db";
import {
  type Connection,
  connections,
  type Service,
  services,
  type TaskConfiguration,
  type TaskFile,
  taskFiles,
  taskLogs,
  tasks,
  type TaskSpecificConfigurations,
  type WorkFlow,
  workflowRuns,
} from "../db/schema";
import { ExternalServices } from "./External";
import { LogMessageService } from "@/config/const";
import { pusher } from "@/lib/pusher/server";
import { eventManager } from "@/lib/utils";

const taskSelect = {
  id: tasks.id,
  updatedAt: tasks.updatedAt,
  serviceId: tasks.serviceId,
  workflowId: tasks.workflowId,
  configuration: tasks.configuration,
  service: services,
  files: taskFiles,
};

interface ExternalFile {
  blob: Blob;
  name: string;
}

export class WorkflowService {
  private workflow: WorkFlow;
  private userId: string = null!;
  private workflowRunId: number = null!;
  private externalFiles: ExternalFile[] | undefined = undefined;
  private handleEvent: (cb: () => Promise<unknown>) => Promise<void> = null!;

  constructor(workflow: WorkFlow, externalFiles?: ExternalFile[]) {
    this.workflow = workflow;
    this.externalFiles = externalFiles;
  }

  public setUserId(userId: string) {
    this.userId = userId;
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
              where: eq(connections.userId, this.userId),
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
          (
            task.configuration as TaskSpecificConfigurations["Manual Trigger"]["clickButton"]
          ).content ?? "";
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
    const service = task.service;
    const serviceExternal = ExternalServices[service.name];

    let taskLogsResult: unknown[];
    try {
      const methodToExecute = serviceExternal[service.method as never] as (t: {
        connection: Connection;
        configuration: TaskConfiguration;
        configurationTasksData: Record<string, string>;
        files: TaskFile[];
        externalFiles?: ExternalFile[];
      }) => Promise<void>;

      await methodToExecute({
        connection: task.service.connections[0]!,
        configuration: task.configuration!,
        configurationTasksData: this.configurationTasksData,
        files: task.files,
        externalFiles: this.externalFiles,
      });

      taskLogsResult = await db
        .insert(taskLogs)
        .values({
          logMessage: (
            LogMessageService[service.name][
              service.method as keyof (typeof LogMessageService)[typeof service.name]
            ] as unknown as { success: string; error: string; warning: string }
          ).success,
          status: "success",
          taskId: task.id,
          workflowRunId: this.workflowRunId,
        })
        .returning();
    } catch (error) {
      console.log(error);

      taskLogsResult = await db
        .insert(taskLogs)
        .values([
          {
            logMessage: (
              LogMessageService[service.name][
                service.method as keyof (typeof LogMessageService)[typeof service.name]
              ] as unknown as {
                success: string;
                error: string;
                warning: string;
              }
            ).error,
            status: "error",
            taskId: task.id,
            workflowRunId: this.workflowRunId,
          },
          {
            logMessage: (
              LogMessageService[service.name][
                service.method as keyof (typeof LogMessageService)[typeof service.name]
              ] as unknown as {
                success: string;
                error: string;
                warning: string;
              }
            ).warning,
            status: "warning",
            taskId: task.id,
            workflowRunId: this.workflowRunId,
          },
        ])
        .returning();
    } finally {
      void this.handleEvent(() =>
        pusher.trigger(
          `workflow-${this.workflow.id}`,
          "tak-log-created",
          taskLogsResult,
        ),
      );
    }
  };

  public async executeWorkflow() {
    const { initialTrigger, tasks } = await this.getWorkflowData();
    this.handleEvent = eventManager();

    const [workflowRun] = await db
      .insert(workflowRuns)
      .values({
        workflowId: this.workflow.id,
        status: "in_progress",
      })
      .returning();

    this.workflowRunId = workflowRun!.id;
    const CHANNEL_NAME = `workflows-execution-for-${this.userId}`;

    void this.handleEvent(() =>
      pusher.trigger(CHANNEL_NAME, "in-progress", {
        workflowRun,
        workflow: this.workflow,
      }),
    );

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

    const completed_at = new Date();

    await db
      .update(workflowRuns)
      .set({ status: "completed", completed_at })
      .where(eq(workflowRuns.id, workflowRun!.id));

    void this.handleEvent(() =>
      pusher.trigger(CHANNEL_NAME, "completed", {
        workflowRun: {
          ...workflowRun,
          status: "completed",
          completed_at,
        },
        workflow: this.workflow,
      }),
    );
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
