import "server-only";
import { array, boolean, number, object, string } from "zod";

export const manualTriggerClickButtonConfigServerSchema = object({
  taskId: string(),
  content: string()
    .min(1, "Content is required")
    .max(600, "Content too long")
    .optional(),
});

export const discordPostMessageConfigServerSchema = object({
  content: string().min(1, "Message required"),
  tts: boolean().default(false),
  embeds: array(
    object({
      title: string(),
      description: string().optional(),
      url: string().optional(),
      color: number().optional(),
      fields: array(
        object({
          name: string(),
          value: string(),
          inline: boolean().optional(),
        }),
      ).optional(),
    }),
  ).optional(),
  guildId: string(),
  channelId: string(),
});
