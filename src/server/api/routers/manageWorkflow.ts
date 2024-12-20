import { workflowTasksSchema } from "@/lib/validators/both";
import {
  services,
  type Task,
  taskDependencies,
  type TaskDependency,
  taskFiles,
  tasks,
  workflowRuns,
  workflows,
} from "@/server/db/schema";
import {
  WorkflowService,
  WorkFlowServiceError,
} from "@/server/services/WorkflowService";
import { deleteManyTasks } from "@/server/uploadthing";
import { TRPCError } from "@trpc/server";
import { and, count, eq, inArray, sql, type SQL } from "drizzle-orm";
import { string } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getSubscription } from "@/server/db/data";
import {
  getLimitMontlyExecutions,
  getLimitServiceIntegrations,
} from "@/server/subscription";

export const manageWorkflowRouter = createTRPCRouter({
  saveDataInWorkflow: protectedProcedure
    .input(workflowTasksSchema)
    .mutation(
      async ({
        ctx,
        input: {
          tasks: tasksFromClient,
          taskDependencies: taskDependenciesFromClient,
          workflowId,
        },
      }) => {
        const [workflow] = await ctx.db.query.workflows.findMany({
          where: and(
            eq(workflows.id, workflowId),
            eq(workflows.userId, ctx.session.user.id),
          ),
          columns: {
            id: true,
          },
        });

        if (!workflow) throw new TRPCError({ code: "UNAUTHORIZED" });

        const subscription = await getSubscription();
        const limitServices = getLimitServiceIntegrations(subscription?.plan);

        const uniqueServices = new Set();

        if (limitServices) {
          for (const taskClient of tasksFromClient) {
            uniqueServices.add(taskClient.serviceId);
          }
        }

        const tasksTriggers = await ctx.db.query.services.findMany({
          columns: { id: true, name: true, method: true },
          where: and(
            eq(services.type, "trigger"),
            inArray(
              services.id,
              tasksFromClient.map((data) => data.serviceId),
            ),
          ),
        });

        if (tasksTriggers.length > 1)
          throw new TRPCError({ code: "BAD_REQUEST" });

        const tasksFromClientIndexed = tasksFromClient.reduce(
          (acc, curr) => {
            acc[curr.tempId] = curr;
            return acc;
          },
          {} as Record<string, (typeof tasksFromClient)[number]>,
        );

        if (tasksTriggers[0]) {
          const triggerDependsOnAction = taskDependenciesFromClient.some(
            (dependency) =>
              tasksFromClientIndexed[dependency.taskTempId]!.serviceId ===
              tasksTriggers[0]?.id,
          );

          if (triggerDependsOnAction) {
            throw new TRPCError({
              code: "BAD_REQUEST",
            });
          }
        }

        const difference = tasksTriggers[0]?.name === "Manual Trigger" ? 1 : 0;
        if (limitServices && uniqueServices.size - difference > limitServices) {
          throw new TRPCError({
            code: "FORBIDDEN",
            cause: "LIMITED PLAN",
            message: `Your plan is up to ${limitServices} service integrations`,
          });
        }

        if (!WorkflowService.validateDependencies(taskDependenciesFromClient)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid dependencies",
          });
        }

        return ctx.db.transaction(async (tx) => {
          await tx
            .delete(taskDependencies)
            .where(eq(taskDependencies.workflowId, workflowId));

          const tasksInDB = await tx.query.tasks.findMany({
            where: eq(tasks.workflowId, workflowId),
            with: {
              files: true,
            },
          });

          const tasksMustBeDeleted = tasksInDB.filter(
            (t) => !Boolean(tasksFromClientIndexed[t.id]),
          );

          await deleteManyTasks(tasksMustBeDeleted, tx);

          const tasksInDbIndexed = tasksInDB.reduce<
            Record<string, (typeof tasksInDB)[number]>
          >((acc, curr) => {
            acc[curr.id] = curr;
            return acc;
          }, {});

          const { existingTasks, nonExistingTasks } = tasksFromClient.reduce<{
            existingTasks: typeof tasksFromClient;
            nonExistingTasks: typeof tasksFromClient;
          }>(
            (acc, curr) => {
              if (tasksInDbIndexed[curr.tempId]) {
                acc.existingTasks.push(curr);
              } else {
                acc.nonExistingTasks.push(curr);
              }

              return acc;
            },
            { existingTasks: [], nonExistingTasks: [] },
          );

          let savedTasks: Task[] = [];

          if (existingTasks.length > 0) {
            const sqlPositionX: SQL[] = [];
            const sqlPositionY: SQL[] = [];
            const taskExistingIds: string[] = [];

            sqlPositionX.push(sql`(case`);
            sqlPositionY.push(sql`(case`);

            for (const task of existingTasks) {
              sqlPositionX.push(
                sql`when ${tasks.id} = ${task.tempId} then ${task.position.x}::numeric`,
              );
              sqlPositionY.push(
                sql`when ${tasks.id} = ${task.tempId} then ${task.position.y}::numeric`,
              );
              taskExistingIds.push(task.tempId);
            }

            sqlPositionX.push(sql`end)`);
            sqlPositionY.push(sql`end)`);

            const finalX = sql.join(sqlPositionX, sql.raw(" "));
            const finalY = sql.join(sqlPositionY, sql.raw(" "));

            await tx
              .update(tasks)
              .set({ positionX: finalX, positionY: finalY })
              .where(inArray(tasks.id, taskExistingIds));

            savedTasks = existingTasks.map(
              ({ tempId }) => tasksInDbIndexed[tempId]!,
            );
          }

          if (nonExistingTasks.length > 0) {
            savedTasks.push(
              ...(await tx
                .insert(tasks)
                .values(
                  nonExistingTasks.map(({ serviceId, position }) => ({
                    workflowId,
                    serviceId,
                    positionX: position.x,
                    positionY: position.y,
                  })),
                )
                .returning()),
            );
          }

          let indexFinished = 0;
          const saveTasksIds1 = existingTasks.reduce(
            (acc, curr, index) => {
              indexFinished++;
              acc[curr.tempId] = savedTasks[index]!.id;
              return acc;
            },
            {} as Record<string, string>,
          );

          const saveTasksIds = nonExistingTasks.reduce((acc, curr, index) => {
            acc[curr.tempId] = savedTasks[indexFinished + index]!.id;
            return acc;
          }, saveTasksIds1);

          let savedDependencies: TaskDependency[] = [];

          if (taskDependenciesFromClient.length > 0) {
            savedDependencies = await tx
              .insert(taskDependencies)
              .values(
                taskDependenciesFromClient.map(
                  ({ taskDependencyTempId, taskTempId }) => ({
                    taskId: saveTasksIds[taskTempId]!,
                    workflowId,
                    dependsOnTaskId: saveTasksIds[taskDependencyTempId]!,
                  }),
                ),
              )
              .returning();
          }

          return { savedTasks, savedDependencies };
        });
      },
    ),

  getDataFromWorkflow: protectedProcedure
    .input(string())
    .query(async ({ ctx, input: workflowId }) => {
      const [workflow] = await ctx.db.query.workflows.findMany({
        where: and(
          eq(workflows.id, workflowId),
          eq(workflows.userId, ctx.session.user.id),
        ),
        with: {
          tasks: {
            columns: {
              id: true,
              positionX: true,
              positionY: true,
              serviceId: true,
              updatedAt: true,
              workflowId: true,
            },
          },
          tasksDependencies: {
            columns: {
              dependsOnTaskId: true,
              taskId: true,
            },
          },
        },
      });

      if (!workflow) throw new TRPCError({ code: "UNAUTHORIZED" });

      return workflow;
    }),

  triggerWorkflow: protectedProcedure
    .input(string())
    .mutation(async ({ ctx, input: workflowId }) => {
      const [workflow] = await ctx.db
        .select()
        .from(workflows)
        .where(
          and(
            eq(workflows.id, workflowId),
            eq(workflows.userId, ctx.session.user.id),
          ),
        );

      if (!workflow) throw new TRPCError({ code: "UNAUTHORIZED" });

      if (workflow.isRunning || !workflow.isActive)
        throw new TRPCError({ code: "BAD_REQUEST" });

      const subscriptions = await getSubscription();

      const limitedExecutions = getLimitMontlyExecutions(subscriptions?.plan);

      if (limitedExecutions) {
        const [executions] = await ctx.db
          .select({ count: count(workflowRuns.id) })
          .from(workflowRuns)
          .where(eq(workflowRuns.workflowId, workflowId));

        if (executions!.count >= limitedExecutions) {
          throw new TRPCError({
            code: "FORBIDDEN",
            cause: "LIMITED PLAN",
            message: `Your plan is up to ${limitedExecutions} executions per workflow`,
          });
        }
      }

      await ctx.db
        .update(workflows)
        .set({ isRunning: true })
        .where(eq(workflows.id, workflowId));

      const workflowService = new WorkflowService(workflow);

      workflowService.setUserId(ctx.session.user.id);

      try {
        await workflowService.executeWorkflow();
      } catch (error) {
        if (error instanceof WorkFlowServiceError) {
          throw new TRPCError({ code: "CONFLICT", message: error.message });
        }
      }

      await ctx.db
        .update(workflows)
        .set({ isRunning: false })
        .where(eq(workflows.id, workflowId));

      return;
    }),

  getTaskConfiguration: protectedProcedure
    .input(string())
    .query(async ({ ctx, input: taskId }) => {
      const taskResults = await ctx.db
        .select({ configuration: tasks.configuration, files: taskFiles })
        .from(tasks)
        .leftJoin(workflows, eq(workflows.id, tasks.workflowId))
        .leftJoin(taskFiles, eq(taskFiles.taskId, tasks.id))
        .where(
          and(eq(tasks.id, taskId), eq(workflows.userId, ctx.session.user.id)),
        );

      if (!taskResults[0]) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return {
        ...taskResults[0].configuration,
        files: taskResults.map((t) => t.files).filter((t) => t !== null),
      };
    }),
});
