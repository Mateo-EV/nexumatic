import { profileSchema } from "@/lib/validators/both";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const profileRouter = createTRPCRouter({
  updateProfile: protectedProcedure
    .input(profileSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(users)
        .set({ name: input.name })
        .where(eq(users.id, ctx.session.user.id));

      return "user-updated";
    }),
});
