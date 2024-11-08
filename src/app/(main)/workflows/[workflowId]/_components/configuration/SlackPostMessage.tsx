import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import useForm from "@/hooks/useForm";
import { slackPostMessageConfigClientSchema } from "@/lib/validators/client";
import { type NodeData } from "@/providers/WorkflowProvider";
import {
  type TaskFile,
  type TaskSpecificConfigurations,
} from "@/server/db/schema";
import { TextAreaSelector } from "./utils/TextAreaSelector";
import { Label } from "@/components/ui/label";
import { ParentFiles } from "./utils/ParentFiles";
import { useState } from "react";
import { useTaskFileTemporalUploader } from "./utils/TaskFileTemporalUploader";
import { AcceptParentFiles } from "./utils/AcceptParentFiles";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ConnectionButton } from "@/app/(main)/connections/_components/ConnectionButton";
import { SubmitButton } from "@/components/ui/button";
import { useUpdateTaskConfig } from "./utils/useUpdateTaskConfig";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SlackPostMessageProps = {
  task: NodeData & {
    configuration: Nullable<
      TaskSpecificConfigurations["Slack"]["postMessage"]
    > & {
      files: TaskFile[];
    };
  };
};

export const SlackPostMessage = ({ task }: SlackPostMessageProps) => {
  const form = useForm({
    schema: slackPostMessageConfigClientSchema,
    defaultValues: {
      text: task.configuration.text ?? "",
      channelId: task.configuration.channelId ?? "",
      includeFiles: task.configuration.includeFiles ?? false,
    },
  });

  const [extraFiles, setExtraFiles] = useState<number[]>(
    task.configuration.fileIds ?? [],
  );

  const { updateConfiguration, isUpdatingConfiguration } = useUpdateTaskConfig(
    task.id,
    "updateSlackPostMessageConfiguration",
  );

  const { Dropzone, FilesRendered, uploadFileToTask, isUploadingFileToTask } =
    useTaskFileTemporalUploader({
      taskId: task.id,
      savedFiles: task.configuration.files,
    });

  const { data: slackChannels, isLoading: isLoadingSlackChannels } =
    api.serviceData.slackChannels.useQuery(undefined, {
      retry: (count, error) => {
        if (error.data?.code === "NOT_FOUND") return false;

        return count < 2;
      },
    });

  const onSubmit = form.handleSubmit(({ channelId, text, includeFiles }) => {
    updateConfiguration({
      channelId,
      text,
      blocks: extraFiles.map((fileId) => ({ fileId })),
      includeFiles,
    });

    uploadFileToTask();
  });

  const DiscordForm = () => {
    if (isLoadingSlackChannels) {
      return <LoadingSpinner className="mx-auto size-6 text-primary" />;
    }

    if (!slackChannels)
      return (
        <ConnectionButton serviceName="Slack" className="block text-center" />
      );

    return (
      <>
        <FormField
          control={form.control}
          name="channelId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Channel</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a server" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {slackChannels.map(({ id, name }) => (
                    <SelectItem key={id} value={id}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <SubmitButton
          isSubmitting={isUpdatingConfiguration || isUploadingFileToTask}
          type="submit"
        >
          Save
        </SubmitButton>
      </>
    );
  };

  return (
    <Form {...form}>
      <form className="space-y-4 p-2" onSubmit={onSubmit}>
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <TextAreaSelector
                  taskId={task.id}
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-2">
          <Label>Files</Label>
          <ParentFiles
            taskId={task.id}
            setExtraFiles={setExtraFiles}
            extraFiles={extraFiles}
          />
          <FilesRendered />
          <Dropzone />
          <FormField
            control={form.control}
            name="includeFiles"
            render={({ field }) => (
              <AcceptParentFiles
                value={field.value}
                setValue={field.onChange}
              />
            )}
          />
        </div>
        <DiscordForm />
      </form>
    </Form>
  );
};
