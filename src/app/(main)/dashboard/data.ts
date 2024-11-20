import { db } from "@/server/db";
import {
  connections,
  taskLogs,
  workflowRuns,
  workflows,
} from "@/server/db/schema";
import { getSession } from "@/server/session";
import { and, between, count, desc, eq, gte, max, sql } from "drizzle-orm";
import "server-only";

export async function getMonthlyExecutions() {
  const session = (await getSession())!;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [result] = await db
    .select({ workflowRuns: count(workflowRuns.completed_at) })
    .from(workflowRuns)
    .innerJoin(workflows, eq(workflows.id, workflowRuns.workflowId))
    .where(
      and(
        eq(workflows.userId, session.user.id),
        between(workflowRuns.started_at, startOfMonth, startOfNextMonth),
      ),
    );

  return result!.workflowRuns;
}

export async function getActiveWorkflows() {
  const session = (await getSession())!;

  return db.query.workflows.findMany({
    where: and(
      eq(workflows.userId, session.user.id),
      eq(workflows.isActive, true),
    ),
  });
}

export async function getConnections() {
  const session = (await getSession())!;

  return db.query.connections.findMany({
    where: eq(connections.userId, session.user.id),
    limit: 3,
    orderBy: desc(connections.updatedAt),
    with: { services: true },
  });
}

export async function getLogs() {
  const session = (await getSession())!;

  const logs = await db
    .select({
      id: taskLogs.id,
      logMessage: taskLogs.logMessage,
      status: taskLogs.status,
      workflowId: workflows.id,
    })
    .from(workflowRuns)
    .innerJoin(workflows, eq(workflows.id, workflowRuns.workflowId))
    .innerJoin(taskLogs, eq(taskLogs.workflowRunId, workflowRuns.id))
    .where(and(eq(workflows.userId, session.user.id)));

  return logs;
}

export async function getEfficiencyAnalysis() {
  const session = (await getSession())!;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const taskLogsData = await db
    .select({
      day: sql<string>`TO_CHAR(task_logs.created_at, 'Dy') AS day`,
      totalTasks: sql<number>`COUNT(task_logs.id)`,
      successTasks: sql<
        1 | 0
      >`SUM(CASE WHEN task_logs.status = 'success' THEN 1 ELSE 0 END)`,
    })
    .from(taskLogs)
    .innerJoin(workflowRuns, eq(taskLogs.workflowRunId, workflowRuns.id))
    .innerJoin(workflows, eq(workflows.id, workflowRuns.workflowId))
    .where(
      and(
        gte(taskLogs.created_at, sevenDaysAgo),
        eq(workflows.userId, session.user.id),
      ),
    )
    .groupBy(
      taskLogs.created_at,
      sql`day, EXTRACT(DOW FROM task_logs.created_at)`,
    )
    .orderBy(sql`TO_CHAR(task_logs.created_at, 'D')`);

  const efficiencyData = taskLogsData.map((log) => ({
    day: log.day,
    efficiency: Math.round((log.successTasks / log.totalTasks) * 100),
  }));

  return efficiencyData;
}

export async function getExecutedWorkflows() {
  const executedWorkflows = await db
    .select({
      id: workflows.id,
      name: workflows.name,
      lastExecution: max(workflowRuns.started_at),
    })
    .from(workflows)
    .innerJoin(workflowRuns, eq(workflowRuns.workflowId, workflows.id))
    .groupBy(workflows.id)
    .orderBy(desc(max(workflowRuns.started_at)))
    .limit(5);

  return executedWorkflows;
}
