import "server-only";

import {
  type TaskDetails,
  type ServicesMethods,
  type Connection,
  type ConnectionConfiguration,
} from "../db/schema";
import axios from "axios";
import { env } from "@/env";

export const ExternalServices = {
  Discord: {
    postMessage: async (
      connection: Connection & {
        configuration: ConnectionConfiguration["Discord"]["postMessage"];
      },
    ) => {
      try {
        await axios.post(
          `https://discord.com/api/v9/channels/1243040476844789772/messages`,
          { content: "message" },
          {
            headers: {
              Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
            },
          },
        );
      } catch (error) {
        console.log(error);
      }
    },
  },
} as ServicesMethods<() => Promise<void>>;
