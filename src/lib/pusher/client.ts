import PusherJs from "pusher-js";
import { env } from "@/env";

export const pusher = new PusherJs(env.NEXT_PUBLIC_SOKETI_APP_KEY, {
  wsHost: "127.0.0.1",
  wsPort: 6001,
  forceTLS: false,
  disableStats: true,
  enabledTransports: ["ws", "wss"],
  cluster: "",
});
