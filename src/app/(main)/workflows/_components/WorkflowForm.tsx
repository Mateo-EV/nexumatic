"use client";

import { SubmitButton } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import useForm from "@/hooks/useForm";
import { workflowSchema } from "@/lib/validators/both";
import { api } from "@/trpc/react";
import { memo } from "react";
import { toast } from "sonner";

type WorkflowFormProps = {
  closeModal: () => void;
};

export const WorkflowForm = memo(({ closeModal }: WorkflowFormProps) => {
  const form = useForm({
    schema: workflowSchema,
    defaultValues: {
      name: "",
      description: "",
    },
  });
  const apiUtils = api.useUtils();

  const { mutate: createWorkFlow, isPending } = api.workflow.create.useMutation(
    {
      onError: () => {
        toast.error("Something went wrong");
      },
      onSuccess: async (workflow) => {
        await apiUtils.workflow.getAllFromUser.cancel();

        apiUtils.workflow.getAllFromUser.setData(undefined, (prevWorkflows) => {
          if (!prevWorkflows) return;
          return [workflow, ...prevWorkflows];
        });

        void apiUtils.workflow.getAllFromUser.invalidate(undefined, {
          predicate: ({ state }) => !state.data,
        });

        toast.success("Worflow created succesfully");
        closeModal();
      },
    },
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => createWorkFlow(data))}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Name" disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input
                  placeholder="Description"
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <SubmitButton isSubmitting={isPending}>Create</SubmitButton>
      </form>
    </Form>
  );
});
WorkflowForm.displayName = "WorkflowForm";
