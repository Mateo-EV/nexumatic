import { formatExpiresAt } from "@/lib/utils";
import { db } from "@/server/db";
import {
  connections,
  type Service,
  services,
  tasks,
  TaskSpecificConfigurations,
  workflows,
} from "@/server/db/schema";
import { DiscordService } from "@/server/services/DiscordService";
import { GoogleDriveService } from "@/server/services/GoogleDriveService";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { type Session } from "next-auth";
import { revalidateTag } from "next/cache";
import { string } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

async function getConnection(session: Session, serviceName: Service["name"]) {
  const [connection] = await db
    .select({
      id: connections.id,
      createdAt: connections.createdAt,
      userId: connections.userId,
      updatedAt: connections.updatedAt,
      serviceId: connections.serviceId,
      accessToken: connections.accessToken,
      refreshToken: connections.refreshToken,
      expiresAt: connections.expiresAt,
    })
    .from(connections)
    .innerJoin(services, eq(services.id, connections.serviceId))
    .where(
      and(
        eq(connections.userId, session.user.id),
        eq(services.name, serviceName),
      ),
    );

  return connection;
}

export const serviceDataRouter = createTRPCRouter({
  discordGuilds: protectedProcedure.query(async ({ ctx }) => {
    const connection = await getConnection(ctx.session, "Discord");

    if (!connection) throw new TRPCError({ code: "NOT_FOUND" });

    try {
      const discordService = new DiscordService(connection);

      const guilds = await discordService.getCommonGuilds();

      return guilds;
    } catch {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  }),
  discordChannels: protectedProcedure
    .input(string())
    .query(async ({ ctx, input: guildId }) => {
      const connection = await getConnection(ctx.session, "Discord");

      if (!connection) throw new TRPCError({ code: "NOT_FOUND" });

      try {
        const discordService = new DiscordService(connection);

        const channels = await discordService.getChannelsByGuildId(guildId);

        return channels;
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
  restartDiscordData: protectedProcedure.mutation(({ ctx }) => {
    revalidateTag(`common_guilds-${ctx.session.user.id}`);
  }),
  createGoogleDriveListener: protectedProcedure
    .input(string())
    .mutation(async ({ ctx, input: taskId }) => {
      const connection = await getConnection(ctx.session, "Google Drive");

      if (!connection) throw new TRPCError({ code: "NOT_FOUND" });

      const [task] = await db
        .select({ id: tasks.id, configuration: tasks.configuration })
        .from(tasks)
        .leftJoin(workflows, eq(workflows.id, tasks.workflowId))
        .where(
          and(eq(tasks.id, taskId), eq(workflows.userId, ctx.session.user.id)),
        );

      if (!task) throw new TRPCError({ code: "NOT_FOUND" });

      try {
        const googleDriveService = new GoogleDriveService(connection);

        await googleDriveService.init();

        const startPageToken = await googleDriveService.getStartPageToken();

        const configurationTask =
          task.configuration as TaskSpecificConfigurations["Google Drive"]["listenFilesAdded"];

        const data = await googleDriveService.createOrUpdateListener(
          startPageToken,
          configurationTask.channelId ?? undefined,
        );

        return data;
      } catch (error) {
        console.log(error);

        throw new TRPCError({ code: "CONFLICT" });
      }
    }),
});
