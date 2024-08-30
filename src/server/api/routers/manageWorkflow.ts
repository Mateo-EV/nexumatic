import { MAX_TASKS, workflowTasksSchema } from "@/lib/validators";
import {
  type Service,
  services,
  taskDependencies,
  tasks,
  workflows,
} from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { WorkflowService } from "@/server/services/WorkflowService";
import { string } from "zod";

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
          with: {
            tasks: true,
          },
        });

        if (!workflow) throw new TRPCError({ code: "UNAUTHORIZED" });

        const existingServicesIds = workflow.tasks.map(
          (task) => task.serviceId,
        );

        const tasksFromClientSliced = tasksFromClient.slice(
          0,
          MAX_TASKS - workflow.tasks.length,
        );
        const taskDependenciesClientSliced = taskDependenciesFromClient.slice(
          0,
          MAX_TASKS - workflow.tasks.length - 1,
        );

        const allServiceIds = [
          ...existingServicesIds,
          ...tasksFromClientSliced.map((task) => task.serviceId),
        ];
        const servicesFromWorkflow = await ctx.db.query.services.findMany({
          columns: {
            id: true,
            type: true,
          },
          where: inArray(services.id, allServiceIds),
        });

        const serviceTypeMap = servicesFromWorkflow.reduce(
          (acc, service) => {
            acc[service.id] = service.type;
            return acc;
          },
          {} as Record<string, Service["type"]>,
        );

        const existingTrigger = workflow.tasks.find(
          (task) => serviceTypeMap[task.serviceId] === "trigger",
        );

        if (existingTrigger) {
          const newTriggers = tasksFromClientSliced.filter(
            (task) => serviceTypeMap[task.serviceId],
          );

          if (newTriggers.length > 0) {
            throw new TRPCError({ code: "BAD_REQUEST" });
          }
        } else {
          const newTriggers = tasksFromClientSliced.filter(
            (task) => serviceTypeMap[task.serviceId] === "trigger",
          );
          if (newTriggers.length !== 1) {
            throw new TRPCError({ code: "BAD_REQUEST" });
          }
        }

        if (
          !WorkflowService.validateDependencies(taskDependenciesClientSliced)
        ) {
          throw new TRPCError({ code: "BAD_REQUEST" });
        }

        const savedTasks = await ctx.db
          .insert(tasks)
          .values(
            tasksFromClientSliced.map(
              ({ serviceId, details: { position } }) => ({
                workflowId,
                serviceId,
                taskDetails: {
                  position,
                },
              }),
            ),
          )
          .returning();

        const saveTasksIds = tasksFromClientSliced.reduce(
          (acc, curr, index) => {
            acc[curr.tempId] = savedTasks[index]!.id;
            return acc;
          },
          {} as Record<string, string>,
        );

        await ctx.db.insert(taskDependencies).values(
          taskDependenciesClientSliced.map(
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
});
