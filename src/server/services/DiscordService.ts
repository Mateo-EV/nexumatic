import { env } from "@/env";
import axios from "axios";
import { unstable_cache } from "next/cache";
import { type Connection } from "../db/schema";
import { getSession } from "../session";

interface Guild {
  id: string;
  name: string;
  icon?: string;
  owner: boolean;
  permissions: string;
  features: string[];
}

interface Channel {
  id: string;
  name: string;
  type: number; // Tipo de canal (texto, voz, etc.)
  guild_id: string;
  position: number;
}

type GuildsResponse = Guild[];
type ChannelsResponse = Channel[];

export class DiscordService {
  private BOT_TOKEN = env.DISCORD_BOT_TOKEN;
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  public async getCommonGuilds() {
    const session = (await getSession())!;
    return this.getCacheableCommonGuilds(session.user.id);
  }

  private async getCacheableCommonGuilds(userId: string) {
    const functionCached = unstable_cache(async () => {
      const [userGuilds, botGuilds] = await Promise.all([
        this.getUserGuilds(),
        this.getBotGuilds(),
      ]);

      if (!userGuilds || !botGuilds) {
        throw new Error("Something went wrong");
      }

      const botGuildIds = new Set(botGuilds.map((guild) => guild.id));

      return userGuilds.filter((guild) => botGuildIds.has(guild.id));
    }, ["common_guilds", userId]);

    return functionCached();
  }

  private async getUserGuilds() {
    try {
      const { data } = await axios.get<GuildsResponse>(
        "https://discord.com/api/v10/users/@me/guilds",
        {
          headers: {
            Authorization: `Bearer ${this.connection.accessToken!}`,
          },
        },
      );

      return data;
    } catch {
      return null;
    }
  }

  private async getBotGuilds() {
    try {
      const { data } = await axios.get<GuildsResponse>(
        "https://discord.com/api/v10/users/@me/guilds",
        {
          headers: {
            Authorization: `Bot ${this.BOT_TOKEN}`,
          },
        },
      );

      return data;
    } catch {
      return null;
    }
  }

  public async getChannelsByGuildId(guildId: string) {
    const guilds = await this.getCommonGuilds();

    if (!guilds.some(({ id }) => id === guildId))
      throw new Error("This guild doesn't allow to you");

    const { data } = await axios.get<ChannelsResponse>(
      `https://discord.com/api/v10/guilds/${guildId}/channels`,
      {
        headers: {
          Authorization: `Bot ${this.BOT_TOKEN}`,
        },
      },
    );

    return data;
  }
}
