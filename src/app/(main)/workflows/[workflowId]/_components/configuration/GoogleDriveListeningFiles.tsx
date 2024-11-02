"use client";

import { SubmitButton } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { type NodeData } from "@/providers/WorkflowProvider";
import {
  type TaskFile,
  type TaskSpecificConfigurations,
} from "@/server/db/schema";
import { api } from "@/trpc/react";
import { useTaskFileTemporalUploader } from "./utils/TaskFileTemporalUploader";

type GoogleDriveListeningFilesProps = {
  task: NodeData & {
    configuration: Nullable<
      TaskSpecificConfigurations["Google Drive"]["listenFilesAdded"]
    > & {
      files: TaskFile[];
    };
  };
};

export const GoogleDriveListeningFiles = ({
  task,
}: GoogleDriveListeningFilesProps) => {
  const { Dropzone, FilesRendered, uploadFileToTask, isUploadingFileToTask } =
    useTaskFileTemporalUploader({
      taskId: task.id,
      savedFiles: task.configuration.files,
    });

  return (
    <>
      <CreateListener task={task} />
      <form className="space-y-2 p-2">
        <div className="space-y-2">
          <Label>Files</Label>
          <FilesRendered />
          <Dropzone />
        </div>
      </form>
    </>
  );
};

const CreateListener = ({ task }: GoogleDriveListeningFilesProps) => {
  const { mutate: createGoogleDriveListener, isPending } =
    api.serviceData.createGoogleDriveListener.useMutation();

  return (
    <div className="p-2">
      <SubmitButton
        isSubmitting={isPending}
        className="w-full"
        onClick={() => createGoogleDriveListener(task.id)}
      >
        Create Listener
      </SubmitButton>
    </div>
  );
};
