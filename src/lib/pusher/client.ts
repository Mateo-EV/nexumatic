import PusherJs from "pusher-js";
import { env } from "@/env";

export const pusher = new PusherJs(env.NEXT_PUBLIC_SOKETI_APP_KEY, {
  wsHost: env.NEXT_PUBLIC_SOKETI_DOMAIN,
  forceTLS: true,
  disableStats: true,
  enabledTransports: ["ws", "wss"],
  cluster: "",
});
