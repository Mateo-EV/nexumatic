import { workflowTasksSchema } from "@/lib/validators";
import {
  services,
  taskDependencies,
  tasks,
  workflows,
} from "@/server/db/schema";
import { WorkflowService } from "@/server/services/WorkflowService";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { string } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

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

        if (tasksTriggers[0]) {
          const tasksFromClientIndexed = tasksFromClient.reduce(
            (acc, curr) => {
              acc[curr.tempId] = curr;
              return acc;
            },
            {} as Record<string, (typeof tasksFromClient)[number]>,
          );

          const triggerDependsOnAction = taskDependenciesFromClient.some(
            (dependency) =>
              tasksFromClientIndexed[dependency.taskTempId]!.serviceId ===
              tasksTriggers[0]?.id,
          );

          if (triggerDependsOnAction)
            throw new TRPCError({
              code: "BAD_REQUEST",
            });
        }

        if (!WorkflowService.validateDependencies(taskDependenciesFromClient)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid dependencies",
          });
        }

        return ctx.db.transaction(async (tx) => {
          await tx.delete(tasks).where(eq(tasks.workflowId, workflowId));

          const savedTasks = await tx
            .insert(tasks)
            .values(
              tasksFromClient.map(({ serviceId, position }) => ({
                workflowId,
                serviceId,
                positionX: position.x,
                positionY: position.y,
              })),
            )
            .returning();

          const saveTasksIds = tasksFromClient.reduce(
            (acc, curr, index) => {
              acc[curr.tempId] = savedTasks[index]!.id;
              return acc;
            },
            {} as Record<string, string>,
          );

          await tx.insert(taskDependencies).values(
            taskDependenciesFromClient.map(
              ({ taskDependencyTempId, taskTempId }) => ({
                taskId: saveTasksIds[taskTempId]!,
                workflowId,
                dependsOnTaskId: saveTasksIds[taskDependencyTempId]!,
              }),
            ),
          );

          return {
            savedTasks,
            saveTasksIds,
          };
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
          tasks: true,
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

      const workflowService = new WorkflowService(workflow);

      workflowService.setSession(ctx.session);

      await workflowService.executeWorkflow();

      return;
    }),
});
