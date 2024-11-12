import { getConnection } from "@/server/db/data";
import { DiscordService } from "@/server/services/DiscordService";
import { TRPCError } from "@trpc/server";
import { revalidateTag } from "next/cache";
import { string } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { SlackService } from "@/server/services/SlackService";
import { Client as NotionClient } from "@notionhq/client";

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
  slackChannels: protectedProcedure.query(async ({ ctx }) => {
    const connection = await getConnection(ctx.session.user.id, "Slack");

    if (!connection) throw new TRPCError({ code: "NOT_FOUND" });

    try {
      const slackService = new SlackService(connection);

      const channels = await slackService.getChannels();

      return channels;
    } catch {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  }),
  // notionPages: protectedProcedure
  //   .input(string())
  //   .query(async ({ ctx, input: databaseId }) => {
  //     const connection = await getConnection(ctx.session.user.id, "Notion");

  //     if (!connection) throw new TRPCError({ code: "NOT_FOUND" });

  //     const notion = new NotionClient({
  //       auth: connection.accessToken!,
  //     });

  //     const notionResult = await notion.databases.query({
  //       database_id: databaseId,
  //     });

  //     console.log(notionResult.results);

  //     const results = notionResult.results as {
  //       id: string;
  //       icon?: { emoji?: string };
  //       properties?: { Name?: { title?: { plain_text: string }[] } };
  //     }[];

  //     return results.map((data) => ({
  //       id: data.id,
  //       name: data.icon?.emoji
  //         ? data.icon.emoji +
  //           " " +
  //           data.properties?.Name?.title?.[0]?.plain_text
  //         : data.properties?.Name?.title?.[0]?.plain_text,
  //     }));
  //   }),
  notionPages: protectedProcedure.query(async ({ ctx }) => {
    const connection = await getConnection(ctx.session.user.id, "Notion");

    if (!connection) throw new TRPCError({ code: "NOT_FOUND" });

    const notion = new NotionClient({
      auth: connection.accessToken!,
    });

    const notionResult = await notion.search({
      filter: {
        value: "page",
        property: "object",
      },
      sort: {
        direction: "ascending",
        timestamp: "last_edited_time",
      },
    });

    const results = notionResult.results as {
      id: string;
      icon?: { emoji?: string };
      properties?: {
        Name?: { title?: { plain_text: string }[] };
        title: { title: { text: { content: string } }[] };
      };
    }[];

    return results.map((data) => {
      let name = data.icon?.emoji ? data.icon.emoji + " " : "";

      name +=
        data.properties?.Name?.title?.[0]?.plain_text ??
        data.properties?.title?.title[0]?.text.content;

      return {
        id: data.id,
        name,
      };
    });
  }),
});
