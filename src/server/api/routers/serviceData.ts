import { connections, services } from "@/server/db/schema";
import { DiscordService } from "@/server/services/DiscordService";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const serviceDataRouter = createTRPCRouter({
  discordGuilds: protectedProcedure.query(async ({ ctx }) => {
    const [connection] = await ctx.db
      .select({ accessToken: connections.accessToken })
      .from(connections)
      .innerJoin(services, eq(services.id, connections.serviceId))
      .where(
        and(
          eq(connections.userId, ctx.session.user.id),
          eq(services.name, "Discord"),
          eq(services.method, "postMessage"),
        ),
      );

    if (!connection) throw new TRPCError({ code: "NOT_FOUND" });

    try {
      const discordService = new DiscordService(connection.accessToken!);

      const guilds = await discordService.getCommonGuilds();

      return guilds;
    } catch {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  }),
});
