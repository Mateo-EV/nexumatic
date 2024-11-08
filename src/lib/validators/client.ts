import { boolean, object, string } from "zod";

export const discordPostMessageConfigClientSchema = object({
  content: string().min(1, "Message required"),
  tts: boolean(),
  guildId: string(),
  channelId: string(),
  includeFiles: boolean(),
});

export const slackPostMessageConfigClientSchema = object({
  text: string().min(1, "Message required"),
  channelId: string(),
  includeFiles: boolean(),
});
