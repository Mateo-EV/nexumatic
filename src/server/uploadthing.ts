import { eq } from "drizzle-orm";
import "server-only";
import { UTApi } from "uploadthing/server";
import { db } from "./db";
import { taskFiles } from "./db/schema";

export const utapi = new UTApi();

export const deleteFile = (fileId: number) => {
  return db.transaction(async (tsx) => {
    const deletedFilesInDb = await tsx
      .delete(taskFiles)
      .where(eq(taskFiles.id, fileId))
      .returning({ key: taskFiles.fileKey });

    await utapi.deleteFiles(deletedFilesInDb.map(({ key }) => key));
  });
};