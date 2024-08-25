import { object, string } from "zod";

export const workflowSchema = object({
  name: string().min(1, "Name is required").max(255, "Name too long"),
  description: string().max(255, "Description too long"),
});
