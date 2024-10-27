import {
  discordPostMessageConfigServerSchema,
  manualTriggerClickButtonConfigServerSchema,
} from "@/lib/validators/server";
import { db } from "@/server/db";
import {
  type Service,
  services,
  type TaskConfiguration,
  taskFiles,
  tasks,
  workflows,
} from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
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
    .mutation(async ({ ctx, input: { taskId, configuration } }) => {
      const taskConfigCanBeUpdated = await taskCanBeUpdated({
        session: ctx.session,
        taskId,
        service: { name: "Manual Trigger", method: "clickButton" },
      });

      if (!taskConfigCanBeUpdated) throw new TRPCError({ code: "FORBIDDEN" });

      await updateTask(taskId, configuration);

      return configuration;
    }),
  updateDiscordPostMessageConfiguration: protectedProcedure
    .input(discordPostMessageConfigServerSchema)
    .mutation(async ({ ctx, input: { taskId, configuration } }) => {
      const taskConfigCanBeUpdated = await taskCanBeUpdated({
        session: ctx.session,
        taskId,
        service: { name: "Discord", method: "postMessage" },
      });

      if (!taskConfigCanBeUpdated) throw new TRPCError({ code: "FORBIDDEN" });

      let embeds = undefined;

      if (configuration.embeds && configuration.embeds.length > 0) {
        const filesData = await ctx.db
          .select({
            url: taskFiles.fileUrl,
            name: taskFiles.fileName,
            type: taskFiles.fileType,
          })
          .from(taskFiles)
          .where(
            inArray(
              taskFiles.id,
              configuration.embeds.map((f) => f.fileId),
            ),
          );

        embeds = filesData.map(({ url, name, type }) => {
          if (type.startsWith("image")) {
            return { image: { url } };
          } else {
            return { title: name, url, description: name };
          }
        });
      }

      await updateTask(taskId, {
        ...configuration,
        embeds,
        fileIds: configuration.embeds?.map((e) => e.fileId),
      });

      return configuration;
    }),
});
