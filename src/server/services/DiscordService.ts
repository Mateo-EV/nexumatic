import { env } from "@/env";
import axios from "axios";

interface Guild {
  id: string;
  name: string;
  icon?: string;
  owner: boolean;
  permissions: string;
  features: string[];
}

type GuildsResponse = Guild[];

export class DiscordService {
  private BOT_TOKEN = env.DISCORD_BOT_TOKEN;
  private access_token: string;

  constructor(access_token: string) {
    this.access_token = access_token;
  }

  public async getCommonGuilds() {
    const [userGuilds, botGuilds] = await Promise.all([
      this.getUserGuilds(),
      this.getBotGuilds(),
    ]);

    if (!userGuilds || !botGuilds) {
      throw new Error("Something went wrong");
    }

    const botGuildIds = new Set(botGuilds.map((guild) => guild.id));

    return userGuilds.filter((guild) => botGuildIds.has(guild.id));
  }

  private async getUserGuilds() {
    try {
      const { data } = await axios.get<GuildsResponse>(
        "https://discord.com/api/v10/users/@me/guilds",
        {
          headers: {
            Authorization: `Bearer ${this.access_token}`,
          },
        },
      );

      return data;
    } catch (e) {
      console.log(e);

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
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}
