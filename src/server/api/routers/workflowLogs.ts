import { workflowRuns, workflows } from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, lt } from "drizzle-orm";
import { number, object, string } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const LIMIT_QUERY = 3;

export const workflowLogsRouter = createTRPCRouter({
  getByWorkflow: protectedProcedure
    .input(object({ workflowId: string(), cursor: number().optional() }))
    .query(async ({ ctx, input: { cursor, workflowId } }) => {
      const workflow = await ctx.db.query.workflows.findFirst({
        where: eq(workflows.id, workflowId),
      });

      if (!workflow || workflow.userId !== ctx.session.user.id)
        throw new TRPCError({ code: "NOT_FOUND" });

      const runs = await ctx.db.query.workflowRuns.findMany({
        where: and(
          eq(workflowRuns.workflowId, workflowId),
          cursor ? lt(workflowRuns.id, cursor) : undefined,
        ),
        with: {
          taskLogs: true,
        },
        limit: LIMIT_QUERY,
        orderBy: desc(workflowRuns.id),
      });

      let nextCursor: number | undefined = undefined;
      if (runs.length > LIMIT_QUERY) {
        const nextItem = runs.pop();
        nextCursor = nextItem?.id;
      }

      return { workflowRuns: runs, nextCursor };
    }),
});
