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
  const { data } = api.serviceData.discordGuilds.useQuery(undefined, {
    retry: (count, error) => {
      if (error.data?.code === "NOT_FOUND") return false;

      return count < 2;
    },
  });

  const form = useForm({
    schema: discordPostMessageConfigClientSchema,
    defaultValues: {
      content: task.configuration.content ?? "",
      channelId: task.configuration.channelId ?? "",
      guildId: task.configuration.guildId ?? "",
      tts: task.configuration.tts ?? false,
    },
  });

  const onSubmit = form.handleSubmit(() => {
    console.log("si");
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
                  <SelectItem value="m@example.com">m@example.com</SelectItem>
                  <SelectItem value="m@google.com">m@google.com</SelectItem>
                  <SelectItem value="m@support.com">m@support.com</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="channelId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Channel</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a channel" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="m@example.com">m@example.com</SelectItem>
                  <SelectItem value="m@google.com">m@google.com</SelectItem>
                  <SelectItem value="m@support.com">m@support.com</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tts"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between space-y-0">
              <FormLabel>Voice Message</FormLabel>
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
        <Button>Save</Button>
      </form>
    </Form>
  );
};
