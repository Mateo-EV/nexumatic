import { workflowSchema } from "@/lib/validators";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { workflows } from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { string } from "zod";

export const workflowRouter = createTRPCRouter({
  create: protectedProcedure
    .input(workflowSchema)
    .mutation(async ({ ctx, input: { name, description } }) => {
      const [workflowCreated] = await ctx.db
        .insert(workflows)
        .values({
          name,
          description: description.length === 0 ? null : description,
          userId: ctx.session.user.id,
        })
        .returning();

      return workflowCreated!;
    }),
  getAllFromUser: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.workflows.findMany({
      where: eq(workflows.userId, ctx.session.user.id),
      orderBy: desc(workflows.updatedAt),
    });
  }),
  delete: protectedProcedure
    .input(string())
    .mutation(async ({ ctx, input: workflowId }) => {
      const [workflowDeleted] = await ctx.db
        .delete(workflows)
        .where(
          and(
            eq(workflows.userId, ctx.session.user.id),
            eq(workflows.id, workflowId),
          ),
        )
        .returning();

      if (!workflowDeleted) {
        throw new TRPCError({
          message: "Something went wrong",
          code: "BAD_REQUEST",
        });
      }

      return workflowDeleted;
    }),
  getById: protectedProcedure
    .input(string())
    .query(async ({ ctx, input: workflowId }) => {
      const [workflow] = await ctx.db
        .select()
        .from(workflows)
        .where(
          and(
            eq(workflows.userId, ctx.session.user.id),
            eq(workflows.id, workflowId),
          ),
        );

      return workflow;
    }),
});
