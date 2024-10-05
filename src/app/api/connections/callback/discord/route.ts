import { env } from "@/env";
import { type NextRequest } from "next/server";
import { object, string } from "zod";
import axios from "axios";
import { db } from "@/server/db";
import { connections, services } from "@/server/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getSession } from "@/server/session";

const discordSearchParamsSchema = object({
  code: string().min(1),
  guild_id: string(),
});

type TokenDiscordResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: "Bearer";
  scope: string;
  guild: {
    id: string;
    name: string;
  };
};

type DiscordChannel = {
  id: string;
  type: number;
  last_message_id?: string | null;
  flags: number;
  guild_id: string;
  name: string;
  parent_id: string | null;
  rate_limit_per_user?: number;
  topic?: string | null;
  position: number;
  permission_overwrites: [];
  nsfw: boolean;
  icon_emoji?: {
    id: string | null;
    name: string;
  } | null;
  theme_color?: string | null;
  bitrate?: number;
  user_limit?: number;
  rtc_region?: string | null;
  voice_background_display?: string | null;
};

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;

    const { code } = discordSearchParamsSchema.parse(
      Object.fromEntries(searchParams.entries()),
    );

    const data = new URLSearchParams({
      client_id: env.NEXT_PUBLIC_DISCORD_CLIENT_ID,
      client_secret: env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri:
        env.NEXT_PUBLIC_BASE_URL + "/api/connections/callback/discord",
    });

    const {
      data: { access_token, expires_in, refresh_token },
    } = await axios.post<TokenDiscordResponse>(
      "https://discord.com/api/oauth2/token",
      data,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    // const { data: channels } = await axios.get<DiscordChannel[]>(
    //   `https://discord.com/api/v9/guilds/${guild.id}/channels`,
    //   {
    //     headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` },
    //   },
    // );

    // const { data: data2 } = await axios.get(
    //   `https://discord.com/api/v9/users/@me/guilds/${webhook.guild_id}/channels`,
    //   {
    //     headers: {
    //       Authorization: `Bearer ${access_token}`,
    //     },
    //   },
    // );

    await db.transaction(async (tsx) => {
      const { id: serviceId } = (await tsx.query.services.findFirst({
        where: and(
          eq(services.name, "Discord"),
          eq(services.method, "postMessage"),
        ),
        columns: {
          id: true,
        },
      }))!;

      await tsx
        .insert(connections)
        .values({
          serviceId,
          userId: session.user.id,
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: new Date(new Date().getTime() + expires_in),
        })
        .onConflictDoUpdate({
          target: [connections.userId, connections.serviceId],
          set: {
            accessToken: sql.raw(`excluded.${connections.accessToken.name}`),
            refreshToken: sql.raw(`excluded.${connections.refreshToken.name}`),
            expiresAt: sql.raw(`excluded.${connections.expiresAt.name}`),
          },
        });
    });

    return Response.redirect(`${env.NEXT_PUBLIC_BASE_URL}/connections`);
  } catch (e) {
    console.log(e);

    return Response.error();
  }
}
