import "server-only";
import Pusher from "pusher";
import { env } from "@/env";

export const pusher = new Pusher({
  appId: env.NEXT_PUBLIC_SOKETI_APP_ID,
  host: "127.0.0.1",
  port: "6001",
  key: env.NEXT_PUBLIC_SOKETI_APP_KEY,
  secret: env.SOKETI_APP_SECRET,
});
