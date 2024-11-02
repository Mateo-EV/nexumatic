import { type NextRequest } from "next/server";
import { object, string, enum as zodEnum } from "zod";

const googleDriveNotificationSchema = object({
  userId: string().min(1),
  changeType: zodEnum(["added", "removed", "modified"]),
  fileId: string().min(1),
  fileName: string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const data = googleDriveNotificationSchema.parse(req.body);

    console.log(data);

    return Response.json(data);
  } catch (error) {
    console.log(error);
    return Response.error();
  }
}
