import { connections } from "@/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { eq } from "drizzle-orm";

export const connectionRouter = createTRPCRouter({
  getAllFromUser: protectedProcedure.query(async ({ ctx }) => {
    const connectionsFromUser = await ctx.db.query.connections.findMany({
      where: eq(connections.userId, ctx.session.user.id),
      columns: {
        id: true,
        serviceId: true,
      },
    });

    return connectionsFromUser.reduce(
      (acc, curr) => {
        acc[curr.serviceId] = curr;
        return acc;
      },
      {} as Record<string, (typeof connectionsFromUser)[number]>,
    );
  }),
});
