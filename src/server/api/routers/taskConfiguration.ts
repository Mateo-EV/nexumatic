import { manualTriggerClickButtonConfigServerSchema } from "@/lib/validators/server";
import { db } from "@/server/db";
import {
  type Service,
  services,
  type TaskConfiguration,
  tasks,
  workflows,
} from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { type Session } from "next-auth";
import { createTRPCRouter, protectedProcedure } from "../trpc";

async function taskCanBeUpdated({
  session,
  taskId,
  service,
}: {
  session: Session;
  taskId: string;
  service: {
    name: Service["name"];
    method: Service["method"];
  };
}) {
  const [task] = await db
    .select({
      id: tasks.id,
      service: { name: services.name, method: services.method },
    })
    .from(tasks)
    .leftJoin(workflows, eq(workflows.id, tasks.workflowId))
    .innerJoin(services, eq(services.id, tasks.serviceId))
    .where(and(eq(tasks.id, taskId), eq(workflows.userId, session.user.id)));

  if (!task) return false;

  if (
    task.service.name !== service.name ||
    task.service.method !== service.method
  )
    return false;

  return true;
}

async function updateTask(taskId: string, configuration: TaskConfiguration) {
  await db
    .update(tasks)
    .set({
      configuration,
    })
    .where(eq(tasks.id, taskId));
}

export const taskConfigurationRouter = createTRPCRouter({
  updateManualTriggerClickButtonConfiguration: protectedProcedure
    .input(manualTriggerClickButtonConfigServerSchema)
    .mutation(async ({ ctx, input: { taskId, ...configuration } }) => {
      const taskConfigCanBeUpdated = await taskCanBeUpdated({
        session: ctx.session,
        taskId,
        service: { name: "Manual Trigger", method: "clickButton" },
      });

      if (!taskConfigCanBeUpdated) throw new TRPCError({ code: "FORBIDDEN" });

      await updateTask(taskId, configuration);

      return configuration;
    }),
});
