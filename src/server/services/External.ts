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
import { Client as NotionClient } from "@notionhq/client";
import { type BlockObjectRequest } from "@notionhq/client/build/src/api-endpoints";

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
      }

      await axios.post(
        `https://discord.com/api/v10/channels/${configuration.channelId}/messages`,
        form,
        {
          headers: {
            Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
          },
        },
      );
    },
  },
  Slack: {
    postMessage: async ({
      configuration,
      configurationTasksData,
      connection,
      files,
      externalFiles,
    }: {
      configurationTasksData: Record<string, string>;
      connection: Connection;
      configuration: TaskSpecificConfigurations["Slack"]["postMessage"];
      files: TaskFile[];
      externalFiles?: {
        blob: Blob;
        name: string;
      }[];
    }) => {
      const isTextFromOtherTask =
        configuration.text.startsWith("{{") &&
        configuration.text.endsWith("}}");

      const text = isTextFromOtherTask
        ? configurationTasksData[configuration.text.slice(2, -2)]
        : configuration.text;

      let blocks = configuration.blocks;

      if (blocks) {
        blocks.push(
          ...files.map(({ fileUrl, fileName, fileType }) => {
            if (fileType.startsWith("image")) {
              return {
                type: "image" as const,
                image_url: fileUrl,
                alt_text: fileName,
              } as const;
            } else {
              return {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `${fileName} <${fileUrl}|Download File>`,
                },
              } as const;
            }
          }),
        );
      } else {
        blocks = files.map(({ fileUrl, fileName, fileType }) => {
          if (fileType.startsWith("image")) {
            return { type: "image", image_url: fileUrl, alt_text: fileName };
          } else {
            return {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `${fileName} <${fileUrl}|Download File>`,
              },
            };
          }
        });
      }

      if (blocks) {
        blocks.unshift({
          type: "section",
          //@ts-expect-error sendMessage
          text: { type: "plain_text", text: "Hello world" },
        });
      }

      const { data } = await axios.post<{ ok: boolean }>(
        "https://slack.com/api/chat.postMessage",
        {
          text: text ?? "",
          channel: configuration.channelId,
          blocks,
        },
        {
          headers: {
            Authorization: `Bearer ${connection.accessToken}`,
          },
        },
      );

      if (!data.ok) {
        console.log(data);

        throw new Error("Something went wrong");
      }

      if (configuration.includeFiles && externalFiles) {
        const files = await Promise.all(
          externalFiles.map(async ({ blob, name }) => {
            const response = await axios.get<{
              ok: boolean;
              upload_url: string;
              file_id: string;
            }>("https://slack.com/api/files.getUploadURLExternal", {
              headers: {
                Authorization: `Bearer ${connection.accessToken}`,
              },
              params: {
                filename: name,
                length: blob.size,
              },
            });

            if (response.data.ok) {
              await axios.post(response.data.upload_url, blob, {
                headers: {
                  "Content-Type": "application/octet-stream",
                },
              });
            }

            return { id: response.data.file_id, title: name };
          }),
        );

        await axios.post(
          "https://slack.com/api/files.completeUploadExternal",
          {
            files,
            channel_id: configuration.channelId,
          },
          {
            headers: {
              Authorization: `Bearer ${connection.accessToken}`,
            },
          },
        );
      }
    },
  },
  Notion: {
    addBlock: async ({
      configuration,
      configurationTasksData,
      connection,
      files,
    }: {
      configurationTasksData: Record<string, string>;
      connection: Connection;
      configuration: TaskSpecificConfigurations["Notion"]["addBlock"];
      files: TaskFile[];
      externalFiles?: {
        blob: Blob;
        name: string;
      }[];
    }) => {
      const isTextFromOtherTask =
        configuration.content.startsWith("{{") &&
        configuration.content.endsWith("}}");

      const text = isTextFromOtherTask
        ? configurationTasksData[configuration.content.slice(2, -2)]
        : configuration.content;

      const blocks: BlockObjectRequest[] = [];

      if (text) {
        blocks.push({
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: text,
                },
              },
            ],
          },
        });
      }

      blocks.push(
        ...files.map(({ fileUrl, fileName, fileType }) => {
          if (fileType.startsWith("image")) {
            return {
              object: "block",
              type: "image",
              image: {
                type: "external",
                external: {
                  url: fileUrl,
                },
              },
            } as const;
          } else {
            return {
              object: "block",
              type: "file",
              file: {
                type: "external",
                external: {
                  url: fileUrl,
                },
                name: fileName,
              },
            } as const;
          }
        }),
      );

      const notion = new NotionClient({
        auth: connection.accessToken!,
      });

      await notion.blocks.children.append({
        block_id: configuration.pageId,
        children: blocks,
      });
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
