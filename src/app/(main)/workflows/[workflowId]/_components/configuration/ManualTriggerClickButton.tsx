import { SubmitButton } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AutosizeTextarea } from "@/components/ui/textarea";
import { type NodeData } from "@/providers/WorkflowProvider";
import {
  type TaskFile,
  type TaskSpecificConfigurations,
} from "@/server/db/schema";
import { useTaskFileTemporalUploader } from "./utils/TaskFileTemporalUploader";
import { useUpdateTaskConfig } from "./utils/useUpdateTaskConfig";

type ManualTriggerClickButtonProps = {
  task: NodeData & {
    configuration: TaskSpecificConfigurations["Manual Trigger"]["clickButton"] & {
      files: TaskFile[];
    };
  };
};

export const ManualTriggerClickButton = ({
  task,
}: ManualTriggerClickButtonProps) => {
  const { Dropzone, FilesRendered, uploadFileToTask, isUploadingFileToTask } =
    useTaskFileTemporalUploader({
      taskId: task.id,
      savedFiles: task.configuration.files,
    });

  const { updateConfiguration, isUpdatingConfiguration } = useUpdateTaskConfig(
    task.id,
  );

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    updateConfiguration({
      content: formData.get("content") as string,
    });

    uploadFileToTask();
  };

  return (
    <form className="space-y-4 p-2" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label>Content</Label>
        <AutosizeTextarea
          placeholder="Write content to share across the workflow"
          maxHeight={100}
          name="content"
          defaultValue={task.configuration.content}
        />
      </div>
      <div className="space-y-2">
        <Label>Files</Label>
        <FilesRendered />
        <Dropzone />
      </div>
      <SubmitButton
        isSubmitting={isUploadingFileToTask || isUpdatingConfiguration}
      >
        Save
      </SubmitButton>
    </form>
  );
};
