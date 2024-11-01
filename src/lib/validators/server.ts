import "server-only";
import { array, boolean, object, string, number } from "zod";

export const manualTriggerClickButtonConfigServerSchema = object({
  taskId: string(),
  configuration: object({
    content: string()
    .min(1, "Content is required")
    .max(600, "Content too long")
    .optional(),
  })
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
  }),
});
