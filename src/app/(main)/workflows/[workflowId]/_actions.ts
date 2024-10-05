"use server";

import { db } from "@/server/db";
import { workflows } from "@/server/db/schema";
import { getSession } from "@/server/session";
import { utapi } from "@/server/uploadthing";
import { and, eq } from "drizzle-orm";
import { UploadFileResult } from "uploadthing/types";
import { object, string, instanceof as instanceof_, array } from "zod";

const fileSchema = array(
  instanceof_(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "Each file must be less than 5MB",
    })
    .refine((file) => file.type.startsWith("image/"), {
      message: "Each file must be an image",
    }),
).optional();

const workflowTemplateSchema = object({
  workflowId: string().min(1),
  content: string()
    .min(1, "Content is required")
    .max(600, "Content too long")
    .optional(),
});

export async function saveWorkflowTemplate(formData: FormData) {
  const session = await getSession();

  if (!session) throw new Error("Unauthorized");

  const validatedContent = workflowTemplateSchema.safeParse(
    Object.fromEntries(formData),
  );

  const validatedFiles = fileSchema.safeParse(formData.getAll("files"));

  if (!validatedContent.success || !validatedFiles.success) {
    throw new Error("Something went wrong");
  }

  const { files, workflowId, content } = {
    ...validatedContent.data,
    files: validatedFiles.data,
  };

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
    .update(workflows)
    .set({
      template: { content, files: filesUploaded.map(({ data }) => data!.url) },
    })
    .where(eq(workflows.id, workflowId));

  return "Updated";
}
