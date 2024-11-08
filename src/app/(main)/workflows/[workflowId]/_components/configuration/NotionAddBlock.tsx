import { ConnectionButton } from "@/app/(main)/connections/_components/ConnectionButton";
import { SubmitButton } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useForm from "@/hooks/useForm";
import { notionAddBlockConfigClientSchema } from "@/lib/validators/client";
import { type NodeData } from "@/providers/WorkflowProvider";
import {
  type TaskFile,
  type TaskSpecificConfigurations,
} from "@/server/db/schema";
import { api } from "@/trpc/react";
import { useState } from "react";
import { ParentFiles } from "./utils/ParentFiles";
import { useTaskFileTemporalUploader } from "./utils/TaskFileTemporalUploader";
import { TextAreaSelector } from "./utils/TextAreaSelector";
import { useUpdateTaskConfig } from "./utils/useUpdateTaskConfig";

type NotionAddBlockProps = {
  task: NodeData & {
    configuration: Nullable<
      TaskSpecificConfigurations["Notion"]["addBlock"]
    > & {
      files: TaskFile[];
    };
  };
};

export const NotionAddBlock = ({ task }: NotionAddBlockProps) => {
  const form = useForm({
    schema: notionAddBlockConfigClientSchema,
    defaultValues: {
      content: task.configuration.content ?? "",
      pageId: task.configuration.pageId ?? "",
      databaseId: task.configuration.databaseId ?? "",
    },
  });

  const [extraFiles, setExtraFiles] = useState<number[]>(
    task.configuration.fileIds ?? [],
  );

  const { updateConfiguration, isUpdatingConfiguration } = useUpdateTaskConfig(
    task.id,
    "updateNotionAddBlockConfiguration",
  );

  const { Dropzone, FilesRendered, uploadFileToTask, isUploadingFileToTask } =
    useTaskFileTemporalUploader({
      taskId: task.id,
      savedFiles: task.configuration.files,
    });

  const { data: notionDatabases, isLoading: isLoadingNotionDatabases } =
    api.serviceData.notionDatabases.useQuery(undefined, {
      retry: (count, error) => {
        if (error.data?.code === "NOT_FOUND") return false;

        return count < 2;
      },
    });

  const databaseIdChosen = form.watch("databaseId");

  const { data: notionPages, isLoading: isLoadingNotionPages } =
    api.serviceData.notionPages.useQuery(databaseIdChosen, {
      enabled: Boolean(notionDatabases) && databaseIdChosen !== "",
    });

  const onSubmit = form.handleSubmit(({ content, pageId, databaseId }) => {
    updateConfiguration({
      content,
      pageId,
      databaseId,
      imageIds: extraFiles,
    });

    uploadFileToTask();
  });

  const DiscordForm = () => {
    if (isLoadingNotionDatabases) {
      return <LoadingSpinner className="mx-auto size-6 text-primary" />;
    }

    if (!notionDatabases)
      return (
        <ConnectionButton serviceName="Notion" className="block text-center" />
      );

    return (
      <>
        <FormField
          control={form.control}
          name="databaseId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Database</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a database" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {notionDatabases.map(({ id, name }) => (
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

        {isLoadingNotionPages ? (
          <LoadingSpinner className="mx-auto size-6 text-primary" />
        ) : (
          notionPages && (
            <>
              <FormField
                control={form.control}
                name="pageId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Page</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a page" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {notionPages.map(({ id, name }) => (
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
          )
        )}
      </>
    );
  };

  return (
    <Form {...form}>
      <form className="space-y-4 p-2" onSubmit={onSubmit}>
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
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
        </div>
        <DiscordForm />
      </form>
    </Form>
  );
};
