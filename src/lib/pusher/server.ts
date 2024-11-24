import "server-only";
import Pusher from "pusher";
import { env } from "@/env";

export const pusher = new Pusher({
  appId: env.NEXT_PUBLIC_SOKETI_APP_ID,
  host: env.NEXT_PUBLIC_SOKETI_DOMAIN,
  key: env.NEXT_PUBLIC_SOKETI_APP_KEY,
  secret: env.SOKETI_APP_SECRET,
  useTLS: true,
});
