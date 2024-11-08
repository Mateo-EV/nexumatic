import { env } from "@/env";
import { saveConnection } from "@/server/db/data";
import { getSession } from "@/server/session";
import axios from "axios";
import { type NextRequest } from "next/server";

interface NotionApiResponse {
  access_token: string;
  token_type: string;
  bot_id: string;
  workspace_name: string;
  workspace_icon: string;
  workspace_id: string;
  owner: {
    type: string;
    user: {
      object: string;
      id: string;
      name: string;
      avatar_url: string;
      type: string;
      person: Record<string, string>;
    };
  };
  duplicated_template_id: string | null;
  request_id: string;
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

    const encoded = Buffer.from(
      `${env.NEXT_PUBLIC_NOTION_CLIENT_ID}:${env.NOTION_CLIENT_SECRET}`,
    ).toString("base64");

    const response = await axios.post<NotionApiResponse>(
      "https://api.notion.com/v1/oauth/token",
      {
        code,
        grant_type: "authorization_code",
        redirect_uri:
          env.NEXT_PUBLIC_BASE_URL + "/api/connections/callback/notion",
      },
      {
        headers: {
          Authorization: `Basic ${encoded}`,
          "Notion-Version": "2022-06-28",
        },
      },
    );

    await saveConnection({
      service: { name: "Notion", method: "addBlock" },
      access_token: response.data.access_token,
    });

    return Response.redirect(`${env.NEXT_PUBLIC_BASE_URL}/connections`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(error.response?.data);
    } else {
      console.log(error);
    }

    return Response.error();
  }
}
