import { getConnection } from "@/server/db/data";
import { DiscordService } from "@/server/services/DiscordService";
import { TRPCError } from "@trpc/server";
import { revalidateTag } from "next/cache";
import { string } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const serviceDataRouter = createTRPCRouter({
  discordGuilds: protectedProcedure.query(async ({ ctx }) => {
    const connection = await getConnection(ctx.session.user.id, "Discord");

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
      const connection = await getConnection(ctx.session.user.id, "Discord");

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
});
