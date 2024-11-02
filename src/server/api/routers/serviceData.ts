import {
  connections,
  type Service,
  services,
  tasks,
  workflows,
} from "@/server/db/schema";
import { DiscordService } from "@/server/services/DiscordService";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "@/server/db";
import { type Session } from "next-auth";
import { string } from "zod";
import { revalidateTag } from "next/cache";
import axios from "axios";
import { GoogleDriveService } from "@/server/services/GoogleDriveService";
import { formatExpiresAt } from "@/lib/utils";

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
        .select({ id: tasks.id })
        .from(tasks)
        .leftJoin(workflows, eq(workflows.id, tasks.workflowId))
        .where(
          and(eq(tasks.id, taskId), eq(workflows.userId, ctx.session.user.id)),
        );

      if (!task) throw new TRPCError({ code: "NOT_FOUND" });

      const googleDriveService = new GoogleDriveService(connection);

      let startPageToken = undefined;

      try {
        startPageToken = await googleDriveService.getStartPageToken();
      } catch {
        try {
          const { access_token, expires_in, refresh_token } =
            await googleDriveService.refreshAccessToken();

          const [newConnection] = await db
            .update(connections)
            .set({
              accessToken: access_token,
              expiresAt: formatExpiresAt(expires_in),
              refreshToken: refresh_token,
            })
            .where(eq(connections.id, connection.id))
            .returning();

          googleDriveService.connection = newConnection!;

          startPageToken = await googleDriveService.getStartPageToken();
        } catch (e) {
          console.log(e);

          throw new TRPCError({ code: "SERVICE_UNAVAILABLE" });
        }
      }

      const channelId = crypto.randomUUID();

      // await axios.post(
      //   'https://www.googleapis.com/drive/v3/changes/watch',
      //   {
      //     pageToken,
      //     id: channelId, // Identificador único del canal
      //     type: 'web_hook',
      //     address: `https://your-server.com/api/notifications`, // URL pública
      //   },
      //   { headers: { Authorization: `Bearer ${accessToken}` } }
      // );

      return "";
    }),
});
