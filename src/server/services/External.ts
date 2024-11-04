import "server-only";

import { env } from "@/env";
import axios from "axios";
import {
  type Connection,
  type ServicesMethods,
  type TaskConfiguration,
  type TaskFile,
  type TaskSpecificConfigurations,
} from "../db/schema";

export const ExternalServices = {
  Discord: {
    postMessage: async ({
      configuration,
      configurationTasksData,
      files,
      externalFiles,
    }: {
      configurationTasksData: Record<string, string>;
      connection: Connection;
      configuration: TaskSpecificConfigurations["Discord"]["postMessage"];
      files: TaskFile[];
      externalFiles?: {
        blob: Blob;
        name: string;
      }[];
    }) => {
      const isContentFromOtherTask =
        configuration.content.startsWith("{{") &&
        configuration.content.endsWith("}}");

      const content = isContentFromOtherTask
        ? configurationTasksData[configuration.content.slice(2, -2)]
        : configuration.content;

      let embeds = configuration.embeds;

      if (embeds) {
        embeds.push(
          ...files.map(({ fileUrl, fileName, fileType }) => {
            if (fileType.startsWith("image")) {
              return { image: { url: fileUrl } };
            } else {
              return { title: fileName, url: fileUrl, description: fileName };
            }
          }),
        );
      } else {
        embeds = files.map(({ fileUrl, fileName, fileType }) => {
          if (fileType.startsWith("image")) {
            return { image: { url: fileUrl } };
          } else {
            return { title: fileName, url: fileUrl, description: fileName };
          }
        });
      }

      const form = new FormData();
      form.append(
        "payload_json",
        JSON.stringify({ content, tts: configuration.tts, embeds }),
      );

      if (configuration.includeFiles && externalFiles) {
        externalFiles.forEach(({ blob, name }) =>
          form.append("file", blob, name),
        );
        console.log(externalFiles);
      }

      try {
        await axios.post(
          `https://discord.com/api/v10/channels/${configuration.channelId}/messages`,
          form,
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
    externalFiles?: Blob[];
  }) => Promise<void>
>;
