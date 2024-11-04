"use client";

import { Button, SubmitButton } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { type NodeData } from "@/providers/WorkflowProvider";
import {
  type TaskFile,
  type TaskSpecificConfigurations,
} from "@/server/db/schema";
import { api } from "@/trpc/react";
import { useTaskFileTemporalUploader } from "./utils/TaskFileTemporalUploader";
import { Input } from "@/components/ui/input";
import { useUpdateTaskConfig } from "./utils/useUpdateTaskConfig";

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    uploadFileToTask();
  };

  return (
    <>
      <CreateListener task={task} />
      <form className="space-y-2 p-2" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label>Files</Label>
          <FilesRendered />
          <Dropzone />
        </div>
        <SubmitButton isSubmitting={isUploadingFileToTask}>Save</SubmitButton>
      </form>
    </>
  );
};

const CreateListener = ({ task }: GoogleDriveListeningFilesProps) => {
  const {
    updateConfiguration: createGoogleDriveListener,
    isUpdatingConfiguration: isCreating,
  } = useUpdateTaskConfig(task.id, "createGoogleDriveListener");

  return (
    <div className="p-2">
      {task.configuration.channelId ? (
        <div className="space-y-2">
          <Label>Channel Id</Label>
          <Input value={task.configuration.channelId} disabled />
          <DeleteListener taskId={task.id} />
        </div>
      ) : (
        <SubmitButton
          isSubmitting={isCreating}
          className="w-full"
          onClick={() => createGoogleDriveListener({})}
        >
          Create Listener
        </SubmitButton>
      )}
    </div>
  );
};

const DeleteListener = ({ taskId }: { taskId: string }) => {
  const {
    updateConfiguration: deleteGoogleDriveListener,
    isUpdatingConfiguration: isDeleting,
  } = useUpdateTaskConfig(taskId, "deleteGoogleDriveListener");

  return (
    <SubmitButton
      isSubmitting={isDeleting}
      onClick={() => deleteGoogleDriveListener({})}
      className="w-full"
      variant="destructive"
    >
      Delete Listener
    </SubmitButton>
  );
};
