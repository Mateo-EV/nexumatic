import { getSession } from "@/server/session";

export async function POST() {
  try {
    const session = await getSession();

    if (!session) return new Response("Unauthorized", { status: 401 });
  } catch {
    return Response.error();
  }
}
