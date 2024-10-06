"use server";

import { createObject } from "@/lib/utils";
import { db } from "@/server/db";
import { tasks, workflows } from "@/server/db/schema";
import { getSession } from "@/server/session";
import { utapi } from "@/server/uploadthing";
import { and, eq } from "drizzle-orm";
import { type UploadFileResult } from "uploadthing/types";
import { array, instanceof as instanceof_, object, string } from "zod";

const fileSchema = array(
  instanceof_(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "Each file must be less than 5MB",
    })
    .refine((file) => file.type.startsWith("image/"), {
      message: "Each file must be an image",
    }),
).optional();

const manulTriggerSettingsSchema = object({
  workflowId: string().min(1),
  taskId: string().min(1),
  content: string()
    .min(1, "Content is required")
    .max(600, "Content too long")
    .optional(),
  files: fileSchema,
});

export async function saveManualTriggerTemplate(formData: FormData) {
  const session = await getSession();

  if (!session) throw new Error("Unauthorized");

  const { content, files, workflowId, taskId } =
    manulTriggerSettingsSchema.parse(createObject(formData));

  const [workflow] = await db
    .select({ id: workflows.id })
    .from(workflows)
    .where(
      and(eq(workflows.id, workflowId), eq(workflows.userId, session.user.id)),
    );

  if (!workflow) throw new Error("Unauthorized");

  let filesUploaded: UploadFileResult[] = [];
  try {
    if (files) {
      filesUploaded = await utapi.uploadFiles(files);
    }
  } catch {
    throw new Error("Something went wrong");
  }

  await db
    .update(tasks)
    .set({
      configuration: {
        content,
        files: filesUploaded.map(({ data }) => data!.url),
      },
    })
    .where(eq(tasks.id, taskId));

  return "Updated";
}
