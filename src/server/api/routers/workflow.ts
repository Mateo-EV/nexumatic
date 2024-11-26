import { workflowSchema } from "@/lib/validators/both";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { getSubscription } from "@/server/db/data";
import { tasks, workflows } from "@/server/db/schema";
import { getLimitAutomatedWorkflows } from "@/server/subscription";
import { deleteManyTasks } from "@/server/uploadthing";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq } from "drizzle-orm";
import { string } from "zod";

export const workflowRouter = createTRPCRouter({
  create: protectedProcedure
    .input(workflowSchema)
    .mutation(async ({ ctx, input: { name, description } }) => {
      const subscription = await getSubscription();

      const limitedWorkflows = getLimitAutomatedWorkflows(subscription?.plan);

      if (limitedWorkflows) {
        const [workflowsCount] = await ctx.db
          .select({ count: count(workflows.id) })
          .from(workflows)
          .where(eq(workflows.userId, ctx.session.user.id));

        if (workflowsCount!.count >= limitedWorkflows) {
          throw new TRPCError({
            code: "FORBIDDEN",
            cause: "LIMITED PLAN",
            message: `Your plan is up to ${limitedWorkflows} workflows`,
          });
        }
      }

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
      orderBy: desc(workflows.createdAt),
    });
  }),
  delete: protectedProcedure
    .input(string())
    .mutation(async ({ ctx, input: workflowId }) => {
      const [workflow] = await ctx.db
        .select()
        .from(workflows)
        .where(
          and(
            eq(workflows.userId, ctx.session.user.id),
            eq(workflows.id, workflowId),
          ),
        );

      if (!workflow) throw new TRPCError({ code: "UNAUTHORIZED" });

      const workflowDeleted = await ctx.db.transaction(async (tx) => {
        const tasksFromWorkflow = await tx.query.tasks.findMany({
          where: eq(tasks.workflowId, workflowId),
          with: {
            files: true,
          },
        });

        await deleteManyTasks(tasksFromWorkflow, tx);

        const [workflowDeleted] = await ctx.db
          .delete(workflows)
          .where(eq(workflows.id, workflowId))
          .returning();

        return workflowDeleted;
      });

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
