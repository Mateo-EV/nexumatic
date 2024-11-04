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
import { Switch } from "@/components/ui/switch";
import useForm from "@/hooks/useForm";
import { discordPostMessageConfigClientSchema } from "@/lib/validators/client";
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
import { RefreshCcwIcon } from "lucide-react";
import { AcceptParentFiles } from "./utils/AcceptParentFiles";

type DiscordPostMessageProps = {
  task: NodeData & {
    configuration: Nullable<
      TaskSpecificConfigurations["Discord"]["postMessage"]
    > & {
      files: TaskFile[];
    };
  };
};

export const DiscordPostMessage = ({ task }: DiscordPostMessageProps) => {
  const form = useForm({
    schema: discordPostMessageConfigClientSchema,
    defaultValues: {
      content: task.configuration.content ?? "",
      channelId: task.configuration.channelId ?? "",
      guildId: task.configuration.guildId ?? "",
      tts: task.configuration.tts ?? false,
      includeFiles: task.configuration.includeFiles ?? false,
    },
  });

  const [extraFiles, setExtraFiles] = useState<number[]>(
    task.configuration.fileIds ?? [],
  );

  const { data: discordGuilds, isLoading: isLoadingDiscordGuilds } =
    api.serviceData.discordGuilds.useQuery(undefined, {
      retry: (count, error) => {
        if (error.data?.code === "NOT_FOUND") return false;

        return count < 2;
      },
    });

  const guildIdChosen = form.watch("guildId");

  const { data: discordChannels, isLoading: isLoadingDiscordChannels } =
    api.serviceData.discordChannels.useQuery(guildIdChosen, {
      enabled: Boolean(discordGuilds) && guildIdChosen !== "",
    });

  const { updateConfiguration, isUpdatingConfiguration } = useUpdateTaskConfig(
    task.id,
    "updateDiscordPostMessageConfiguration",
  );

  const apiUtils = api.useUtils();

  const { mutate: reloadDiscordData, isPending: isRealoading } =
    api.serviceData.restartDiscordData.useMutation({
      onSuccess: async () => {
        await apiUtils.serviceData.discordGuilds.refetch();
        await apiUtils.serviceData.discordChannels.refetch();
      },
    });

  const { Dropzone, FilesRendered, uploadFileToTask, isUploadingFileToTask } =
    useTaskFileTemporalUploader({
      taskId: task.id,
      savedFiles: task.configuration.files,
    });

  const onSubmit = form.handleSubmit(
    ({ channelId, content, guildId, tts, includeFiles }) => {
      updateConfiguration({
        channelId,
        guildId,
        content,
        embeds: extraFiles.map((fileId) => ({ fileId })),
        tts,
        includeFiles,
      });

      uploadFileToTask();
    },
  );

  const DiscordForm = () => {
    if (isLoadingDiscordGuilds) {
      return <LoadingSpinner className="mx-auto size-6 text-primary" />;
    }

    if (!discordGuilds)
      return (
        <ConnectionButton serviceName="Discord" className="block text-center" />
      );

    return (
      <>
        <FormField
          control={form.control}
          name="guildId"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between">
                <FormLabel>Server</FormLabel>
                <button
                  type="button"
                  className="text-primary"
                  onClick={() => reloadDiscordData()}
                >
                  <RefreshCcwIcon
                    className={`size-4 ${isRealoading ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a server" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {discordGuilds.map((guild) => (
                    <SelectItem key={guild.id} value={guild.id}>
                      {guild.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {isLoadingDiscordChannels ? (
          <LoadingSpinner className="mx-auto size-6 text-primary" />
        ) : (
          discordChannels && (
            <>
              <FormField
                control={form.control}
                name="channelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a channel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {discordChannels.map(({ id, name }) => (
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
        <FormField
          control={form.control}
          name="tts"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between space-y-0">
              <FormLabel>Voice</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="mt-0"
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
