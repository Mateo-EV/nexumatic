import { env } from "@/env";
import { saveConnection } from "@/server/db/data";
import { getSession } from "@/server/session";
import axios from "axios";
import { type NextRequest } from "next/server";
import { object, string } from "zod";

const googleSearchParamaSchema = object({
  code: string().min(1),
});

type GoogleOauthResponse = {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
};

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;

    const { code } = googleSearchParamaSchema.parse(
      Object.fromEntries(searchParams.entries()),
    );

    const data = new URLSearchParams({
      code,
      client_id: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri:
        env.NEXT_PUBLIC_BASE_URL + "/api/connections/callback/drive",
      grant_type: "authorization_code",
    });

    const {
      data: { access_token, expires_in, refresh_token },
    } = await axios.post<GoogleOauthResponse>(
      "https://oauth2.googleapis.com/token",
      data,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );

    await saveConnection({
      service: { name: "Google Drive", method: "listenFilesAdded" },
      access_token,
      expires_in,
      refresh_token,
    });

    return Response.redirect(`${env.NEXT_PUBLIC_BASE_URL}/connections`);
  } catch (error) {
    console.log(error);
    return Response.error();
  }
}
