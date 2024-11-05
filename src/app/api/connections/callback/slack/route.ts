import { LINKS_CONNECTIONS } from "@/config/const";
import { env } from "@/env";
import { getSession } from "@/server/session";
import axios from "axios";
import { type NextRequest } from "next/server";

interface SlackApiResponse {
  app_id: string;
  auth_user: {
    id: string;
    access_token: string;
  };
  access_token: string;
  bot_user_id: string;
  team: {
    id: string;
    name: string;
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const code = req.nextUrl.searchParams.get("code");

    if (!code) {
      return new Response("Code not provided", { status: 400 });
    }

    const {
      data: { access_token },
    } = await axios.post<SlackApiResponse>(
      "https://slack.com/api/oauth.v2.access",
      new URLSearchParams({
        code,
        client_id: env.NEXT_PUBLIC_SLACK_CLIENT_ID,
        client_secret: env.SLACK_CLIENT_SECRET,
        redirect_uri: LINKS_CONNECTIONS.Slack,
      }),
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(error.response?.data);
    } else {
      console.log(error);
    }

    return Response.error();
  }
}
