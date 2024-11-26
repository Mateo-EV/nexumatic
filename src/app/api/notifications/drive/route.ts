/* eslint-disable @typescript-eslint/no-empty-object-type */
import { db } from "@/server/db";
import {
  getConnection,
  getSubscription,
  getSubscriptionByUser,
} from "@/server/db/data";
import { workflowRuns, workflows } from "@/server/db/schema";
import { GoogleDriveService } from "@/server/services/GoogleDriveService";
import { WorkflowService } from "@/server/services/WorkflowService";
import { getLimitMontlyExecutions } from "@/server/subscription";
import axios from "axios";
import { count, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { object, string } from "zod";

enum Type {
  TYPE_UNSPECIFIED,
  MY_DRIVE_ROOT,
  SHARED_DRIVE_ROOT,
  STANDARD_FOLDER,
}

interface Actor {
  user:
    | {
        knownUser: {
          personName: string;
          isCurrentUser: boolean;
        };
      }
    | {
        unknownUser: {};
      };
}

type TargetReference =
  | {
      driveItem: {
        name: string;
        title: string;
      } & (
        | { driveFile: {}; driveFolder: undefined }
        | { driveFolder: { type: Type }; driveFile: undefined }
      );
    }
  | {
      drive: {
        name: string;
        title: string;
      };
    };

type Create =
  | {
      new: {};
    }
  | {
      upload: {};
    }
  | { copy: { originalObject: TargetReference } };

interface ActionDetail {
  create?: Create;
}

interface TimeRange {
  startTime: string;
  endTime: string;
}

type Target =
  | {
      driveItem: {
        name: string;
        title: string;
      } & (
        | { driveFile: {}; driveFolder: undefined }
        | { driveFolder: { type: Type }; driveFile: undefined }
      );
      drive: undefined;
    }
  | {
      drive: {
        name: string;
        title: string;
      };
      driveItem: undefined;
    };

interface Action {
  actor: Actor;
  detail?: ActionDetail;
  target: Target;
  timestamp?: string;
  timeRange?: TimeRange;
}

interface DriveActivity {
  primaryActionDetail: ActionDetail;
  actors: Actor[];
  actions: Action[];
  targets: Target[];
  timestamp?: string;
  timeRange?: TimeRange;
}

interface ActivityQueryResponse {
  activities?: DriveActivity[];
  nextPageToken?: string;
}

const googleDriveNotificationSchema = object({
  "x-goog-resource-state": string().min(1, "Falta el estado del recurso"),
  "x-goog-resource-id": string().min(1, "Falta el ID del recurso"),
  "x-goog-channel-id": string().min(1, "Falta el ID del canal"),
});

export async function POST() {
  let workflowId: string | undefined = undefined;

  try {
    const headerList = googleDriveNotificationSchema.parse(
      Object.fromEntries(headers()),
    );

    const task = await db.query.tasks.findFirst({
      where: sql`configuration->>'channelId'=${headerList["x-goog-channel-id"]}`,
      with: { workflow: { with: { user: true } } },
    });

    if (
      !task?.configuration ||
      task.workflow.isRunning ||
      !task.workflow.isActive
    )
      return new Response("Invalid channelId", { status: 400 });

    const subscription = await getSubscriptionByUser(task.workflow.user);

    const limitedExecutions = getLimitMontlyExecutions(subscription?.plan);

    if (limitedExecutions) {
      const [executions] = await db
        .select({ count: count(workflowRuns.id) })
        .from(workflowRuns)
        .where(eq(workflowRuns.workflowId, task.workflowId));

      if (executions!.count >= limitedExecutions) {
        return new Response("Invalid channelId", { status: 400 });
      }
    }

    workflowId = task.workflow.id;

    await db
      .update(workflows)
      .set({ isRunning: true })
      .where(eq(workflows.id, task.workflow.id));

    const connection = await getConnection(
      task.workflow.user.id,
      "Google Drive",
    );

    if (!connection)
      return new Response("Invalid for this user", { status: 400 });

    const service = new GoogleDriveService(connection);

    await service.init();

    const files = await getFilesCreated(service.connection.accessToken!);

    if (!files || files.length === 0)
      return new Response("No files", { status: 400 });

    const workflowService = new WorkflowService(task.workflow, files);

    workflowService.setUserId(task.workflow.user.id);

    await workflowService.executeWorkflow();

    return Response.json(headerList);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(error.response?.data);
    } else {
      console.log(error);
    }

    return Response.error();
  } finally {
    if (workflowId) {
      await db
        .update(workflows)
        .set({ isRunning: false })
        .where(eq(workflows.id, workflowId));
    }
  }
}

async function getFilesCreated(access_token: string) {
  const date = new Date();
  date.setSeconds(date.getSeconds() - 10);
  const timeFilter = date.getTime();

  const { data } = await axios.post<ActivityQueryResponse>(
    "https://driveactivity.googleapis.com/v2/activity:query",
    {
      filter: `time >= ${timeFilter} AND detail.action_detail_case:CREATE`,
    },
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    },
  );

  if (!data.activities) return null;

  const fileData = data.activities.find((activity) =>
    Boolean(activity.primaryActionDetail.create),
  );

  if (!fileData) return null;

  const targetFiles = fileData.targets.filter((f) =>
    Boolean(f.driveItem?.name && f.driveItem.driveFile),
  );

  const files = await Promise.all(
    targetFiles.map(async (targetFile) => {
      const fileId = targetFile.driveItem!.name.split("items/")[1];
      const req = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );

      return { blob: await req.blob(), name: targetFile.driveItem!.title };
    }),
  );

  return files;
}
