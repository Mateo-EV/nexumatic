import { workflowRouter } from "@/server/api/routers/workflow";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { manageWorkflowRouter } from "./routers/manageWorkflow";
import { connectionRouter } from "./routers/connection";
import { taskConfigurationRouter } from "./routers/taskConfiguration";
import { serviceDataRouter } from "./routers/serviceData";
import { workflowLogsRouter } from "./routers/workflowLogs";
import { profileRouter } from "./routers/profile";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  workflow: workflowRouter,
  manageWorkflow: manageWorkflowRouter,
  connection: connectionRouter,
  taskConfiguration: taskConfigurationRouter,
  serviceData: serviceDataRouter,
  workflowLogs: workflowLogsRouter,
  profile: profileRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
