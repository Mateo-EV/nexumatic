import "server-only";
import { array, boolean, object, string, number } from "zod";

export const manualTriggerClickButtonConfigServerSchema = object({
  taskId: string(),
  configuration: object({
    content: string()
      .min(1, "Content is required")
      .max(600, "Content too long")
      .optional(),
  }),
});

export const discordPostMessageConfigServerSchema = object({
  taskId: string(),
  configuration: object({
    content: string().min(1, "Message required"),
    tts: boolean().default(false),
    embeds: array(
      object({
        fileId: number(),
      }),
    ).optional(),
    guildId: string(),
    channelId: string(),
    includeFiles: boolean().optional(),
  }),
});

export const slackPostMessageConfigServerSchema = object({
  taskId: string(),
  configuration: object({
    text: string().min(1, "Message required"),
    blocks: array(
      object({
        fileId: number(),
      }),
    ).optional(),
    channelId: string(),
    includeFiles: boolean().optional(),
  }),
});

export const notionAddBlockConfigServerSchema = object({
  taskId: string(),
  configuration: object({
    content: string().min(1, "Message required"),
    imageIds: array(number()).optional(),
    pageId: string(),
    databaseId: string(),
  }),
});

export const googleDriveListenFilesAddedServerSchema = object({
  taskId: string(),
  configuration: object({}),
});
