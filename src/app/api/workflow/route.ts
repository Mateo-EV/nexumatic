import { getSession } from "@/server/session";
import { type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) return new Response("Unauthorized", { status: 401 });
  } catch (error) {
    return Response.error();
  }
}
