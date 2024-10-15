import { connections, type Service, services } from "@/server/db/schema";
import { DiscordService } from "@/server/services/DiscordService";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "@/server/db";
import { type Session } from "next-auth";
import { string } from "zod";

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
});
