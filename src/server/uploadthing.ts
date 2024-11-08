/* eslint-disable @typescript-eslint/consistent-type-imports */
import { env } from "@/env";
import { eq, ExtractTablesWithRelations, inArray } from "drizzle-orm";
import { NeonQueryResultHKT } from "drizzle-orm/neon-serverless";
import { PgTransaction } from "drizzle-orm/pg-core";
import "server-only";
import { UTApi } from "uploadthing/server";
import { db } from "./db";
import { type Task, type TaskFile, taskFiles, tasks } from "./db/schema";

export const utapi = new UTApi({ token: env.UPLOADTHING_TOKEN });

export const deleteFile = (fileId: number) => {
  return db.transaction(async (tsx) => {
    const deletedFilesInDb = await tsx
      .delete(taskFiles)
      .where(eq(taskFiles.id, fileId))
      .returning({ key: taskFiles.fileKey });

    await utapi.deleteFiles(deletedFilesInDb.map(({ key }) => key));
  });
};

export async function deleteManyTasks(
  tasksClient: (Task & { files: TaskFile[] })[],
  dbs: PgTransaction<
    NeonQueryResultHKT,
    typeof import("d:/nextjs/nexumatic/src/server/db/schema"),
    ExtractTablesWithRelations<
      typeof import("d:/nextjs/nexumatic/src/server/db/schema")
    >
  >,
) {
  if (tasksClient.length === 0) return;

  return await dbs.transaction(async (tx) => {
    const { keys, tasksIds } = tasksClient.reduce<{
      keys: string[];
      tasksIds: string[];
    }>(
      (acc, curr) => {
        const keys = curr.files.map((f) => f.fileKey);
        const tasksIds = curr.id;

        acc.keys.push(...keys);
        acc.tasksIds.push(tasksIds);
        return acc;
      },
      { keys: [], tasksIds: [] },
    );

    console.log(keys, tasksIds);

    if (keys.length > 0) {
      await utapi.deleteFiles(keys);
    }

    await tx.delete(tasks).where(inArray(tasks.id, tasksIds));
  });
}
