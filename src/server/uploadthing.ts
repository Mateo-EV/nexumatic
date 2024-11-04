import { eq, inArray } from "drizzle-orm";
import "server-only";
import { UTApi } from "uploadthing/server";
import { db } from "./db";
import {
  connections,
  type Service,
  type Task,
  TaskConfiguration,
  type TaskFile,
  taskFiles,
  tasks,
  TaskSpecificConfigurations,
} from "./db/schema";
import { env } from "@/env";
import { getSession } from "./session";
import { getConnection } from "./db/data";
import { GoogleDriveService } from "./services/GoogleDriveService";
import { TRPCError } from "@trpc/server";

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
) {
  if (tasksClient.length === 0) return;

  return await db.transaction(async (tx) => {
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

    await utapi.deleteFiles(keys);

    await tx.delete(tasks).where(inArray(tasks.id, tasksIds));
  });
}
