import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import useForm from "@/hooks/useForm";
import { type NodeData } from "@/providers/WorkflowProvider";
import {
  type TaskFile,
  type TaskSpecificConfigurations,
} from "@/server/db/schema";
import { TextAreaSelector } from "./utils/TextAreaSelector";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { discordPostMessageConfigClientSchema } from "@/lib/validators/client";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ConnectionButton } from "@/app/(main)/connections/_components/ConnectionButton";
import { useTaskFileTemporalUploader } from "./utils/TaskFileTemporalUploader";
import { Label } from "@/components/ui/label";

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
    },
  });

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

  const onSubmit = form.handleSubmit(() => {
    console.log("si");
  });

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
              <FormLabel>Server</FormLabel>
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

              <Button>Save</Button>
            </>
          )
        )}
      </>
    );
  };

  const { Dropzone, FilesRendered } = useTaskFileTemporalUploader({
    taskId: task.id,
    savedFiles: task.configuration.files,
  });

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
                  defaultValue={field.value}
                  onChange={field.onChange}
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
          <FilesRendered />
          <Dropzone />
        </div>
        <DiscordForm />
      </form>
    </Form>
  );
};
