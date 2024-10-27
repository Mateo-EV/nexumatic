import "server-only";

import { env } from "@/env";
import axios from "axios";
import {
  type Connection,
  type ServicesMethods,
  TaskConfiguration,
  TaskFile,
  TaskSpecificConfigurations,
} from "../db/schema";

export const ExternalServices = {
  Discord: {
    postMessage: async ({
      configuration,
      configurationTasksData,
      files,
    }: {
      configurationTasksData: Record<string, string>;
      connection: Connection;
      configuration: TaskSpecificConfigurations["Discord"]["postMessage"];
      files: TaskFile[];
    }) => {
      const isFromOtherTask =
        configuration.content.startsWith("{{") &&
        configuration.content.endsWith("}}");

      const content = isFromOtherTask
        ? configurationTasksData[configuration.content.slice(2, -2)]
        : configuration.content;

      let embeds = configuration.embeds;

      if (embeds) {
        embeds.push(...files.map((f) => ({ image: { url: f.fileUrl } })));
      } else {
        embeds = files.map((f) => ({ image: { url: f.fileUrl } }));
      }

      try {
        await axios.post(
          `https://discord.com/api/v10/channels/${configuration.channelId}/messages`,
          { content, tts: configuration.tts, embeds },
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
} as ServicesMethods<
  (p: {
    connection: Connection;
    configuration: TaskConfiguration;
    configurationTasksData: Record<string, string>;
    files: TaskFile[];
  }) => Promise<void>
>;
