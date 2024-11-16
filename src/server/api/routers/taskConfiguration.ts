import {
  discordPostMessageConfigServerSchema,
  googleDriveListenFilesAddedServerSchema,
  manualTriggerClickButtonConfigServerSchema,
  notionAddBlockConfigServerSchema,
  slackPostMessageConfigServerSchema,
} from "@/lib/validators/server";
import { db } from "@/server/db";
import { getConnection } from "@/server/db/data";
import {
  type Service,
  services,
  type TaskConfiguration,
  taskFiles,
  tasks,
  type TaskSpecificConfigurations,
  workflows,
} from "@/server/db/schema";
import { GoogleDriveService } from "@/server/services/GoogleDriveService";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { type Session } from "next-auth";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { isAxiosError } from "axios";

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
  createGoogleDriveListener: protectedProcedure
    .input(googleDriveListenFilesAddedServerSchema)
    .mutation(async ({ ctx, input: { taskId } }) => {
      const connection = await getConnection(
        ctx.session.user.id,
        "Google Drive",
      );

      if (!connection) throw new TRPCError({ code: "NOT_FOUND" });

      const [task] = await db
        .select({
          id: tasks.id,
          configuration: tasks.configuration,
          serviceName: services.name,
          serviceMethod: services.method,
        })
        .from(tasks)
        .leftJoin(workflows, eq(workflows.id, tasks.workflowId))
        .leftJoin(services, eq(services.id, tasks.serviceId))
        .where(
          and(eq(tasks.id, taskId), eq(workflows.userId, ctx.session.user.id)),
        );

      if (
        !task ||
        task.serviceName !== "Google Drive" ||
        task.serviceMethod !== "listenFilesAdded"
      )
        throw new TRPCError({ code: "NOT_FOUND" });

      try {
        const googleDriveService = new GoogleDriveService(connection);

        await googleDriveService.init();

        const startPageToken = await googleDriveService.getStartPageToken();

        const configurationTask = task.configuration as
          | TaskSpecificConfigurations["Google Drive"]["listenFilesAdded"]
          | null;

        const { id: channelId, resourceId } =
          await googleDriveService.createOrUpdateListener(
            startPageToken,
            configurationTask?.channelId ?? undefined,
          );

        const configuration = {
          channelId,
          pageToken: startPageToken,
          subscribed: true,
          resourceId,
        };

        await updateTask(taskId, configuration);

        return configuration;
      } catch (error) {
        if (isAxiosError(error)) {
          console.log(error.response?.data);
        } else {
          console.log(error);
        }

        throw new TRPCError({ code: "CONFLICT" });
      }
    }),
  deleteGoogleDriveListener: protectedProcedure
    .input(googleDriveListenFilesAddedServerSchema)
    .mutation(async ({ ctx, input: { taskId } }) => {
      const connection = await getConnection(
        ctx.session.user.id,
        "Google Drive",
      );

      if (!connection) throw new TRPCError({ code: "NOT_FOUND" });

      const [task] = await db
        .select({ id: tasks.id, configuration: tasks.configuration })
        .from(tasks)
        .leftJoin(workflows, eq(workflows.id, tasks.workflowId))
        .where(
          and(eq(tasks.id, taskId), eq(workflows.userId, ctx.session.user.id)),
        );

      if (!task?.configuration) throw new TRPCError({ code: "NOT_FOUND" });

      try {
        const googleDriveService = new GoogleDriveService(connection);

        await googleDriveService.init();

        const { channelId, resourceId } =
          task.configuration as TaskSpecificConfigurations["Google Drive"]["listenFilesAdded"];

        try {
          await googleDriveService.deleteListener(channelId, resourceId);
        } catch (error) {
          if (!isAxiosError(error) || error.status !== 404) {
            throw new Error("Something bad happened");
          }
        }

        await updateTask(taskId, null!);

        return {
          channelId: null,
          pageToken: null,
          subscribed: null,
          resourceId: null,
        };
      } catch (error) {
        if (isAxiosError(error)) {
          console.log(error.response?.data);
        } else {
          console.log(error);
        }

        throw new TRPCError({ code: "CONFLICT" });
      }
    }),
  updateSlackPostMessageConfiguration: protectedProcedure
    .input(slackPostMessageConfigServerSchema)
    .mutation(async ({ ctx, input: { taskId, configuration } }) => {
      const taskConfigCanBeUpdated = await taskCanBeUpdated({
        session: ctx.session,
        taskId,
        service: { name: "Slack", method: "postMessage" },
      });

      if (!taskConfigCanBeUpdated) throw new TRPCError({ code: "FORBIDDEN" });

      let blocks: TaskSpecificConfigurations["Slack"]["postMessage"]["blocks"] =
        undefined;

      if (configuration.blocks && configuration.blocks.length > 0) {
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
              configuration.blocks.map((f) => f.fileId),
            ),
          );

        blocks = filesData.map(({ url, name, type }) => {
          if (type.startsWith("image")) {
            return { type: "image", image_url: url, alt_text: name };
          } else {
            return {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `${name} <${url}|Download File>`,
              },
            };
          }
        });
      }

      const fileIds = configuration.blocks?.map((e) => e.fileId);

      await updateTask(taskId, {
        ...configuration,
        blocks,
        fileIds,
      });

      return { ...configuration, fileIds };
    }),
  updateNotionAddBlockConfiguration: protectedProcedure
    .input(notionAddBlockConfigServerSchema)
    .mutation(async ({ ctx, input: { taskId, configuration } }) => {
      const taskConfigCanBeUpdated = await taskCanBeUpdated({
        session: ctx.session,
        taskId,
        service: { name: "Notion", method: "addBlock" },
      });

      if (!taskConfigCanBeUpdated) throw new TRPCError({ code: "FORBIDDEN" });

      let imageUrls: TaskSpecificConfigurations["Notion"]["addBlock"]["imageUrls"] =
        undefined;

      if (configuration.imageIds && configuration.imageIds.length > 0) {
        const filesData = await ctx.db
          .select({
            url: taskFiles.fileUrl,
            name: taskFiles.fileName,
            type: taskFiles.fileType,
          })
          .from(taskFiles)
          .where(inArray(taskFiles.id, configuration.imageIds));

        imageUrls = filesData.map(({ url, name, type }) => ({
          type: type.startsWith("image") ? "image" : "file",
          url,
          name,
        }));
      }

      const newConfig = {
        content: configuration.content,
        pageId: configuration.pageId,
        imageUrls,
        fileIds: configuration.imageIds,
      };

      await updateTask(taskId, newConfig);

      return newConfig;
    }),
});
