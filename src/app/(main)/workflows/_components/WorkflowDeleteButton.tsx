"use client";

import { Button, SubmitButton } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { WarningAlert } from "@/components/WarningAlert";
import useForm from "@/hooks/useForm";
import { type WorkFlow } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { TrashIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { literal, object } from "zod";

type WorkflowDeleteButtonProps = {
  workflow: WorkFlow;
};

export const WorkflowDeleteButton = ({
  workflow,
}: WorkflowDeleteButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hidden group-hover:inline-flex"
        >
          <TrashIcon className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            This will delete all data asociated with this workflow like tasks
            and it&apos;s dependecies
          </DialogDescription>
        </DialogHeader>
        <WarningAlert>
          This action is not reversible. Please be certain.
        </WarningAlert>
        <WorkflowDeleteForm
          workflow={workflow}
          closeModal={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

type WorkflowDeleteFormProps = {
  workflow: WorkFlow;
  closeModal: () => void;
};

const WorkflowDeleteForm = ({
  workflow,
  closeModal,
}: WorkflowDeleteFormProps) => {
  const form = useForm({
    schema: object({
      "workflow-name-delete": literal(workflow.name, {
        errorMap: () => ({
          message: "Ingrese el nombre del workflow correctamente",
        }),
      }),
    }),
    defaultValues: {
      "workflow-name-delete": "",
    },
  });

  const apiUtils = api.useUtils();

  const { mutate: deleteWorkflow, isPending } = api.workflow.delete.useMutation(
    {
      onError: () => {
        toast.error("Something went wrong");
      },
      onSuccess: async (workflow) => {
        await apiUtils.workflow.getAllFromUser.cancel();

        apiUtils.workflow.getAllFromUser.setData(undefined, (prevWorkflows) => {
          if (!prevWorkflows) return;
          return prevWorkflows.filter(({ id }) => workflow.id !== id);
        });

        void apiUtils.workflow.getAllFromUser.invalidate(undefined, {
          predicate: ({ state }) => !state.data,
        });

        toast.success("Worflow deleted succesfully");
        closeModal();
      },
    },
  );

  return (
    <Form {...form}>
      <form
        id="workflow-delete"
        autoComplete="off"
        onSubmit={form.handleSubmit(() => deleteWorkflow(workflow.id))}
      >
        <FormField
          control={form.control}
          name="workflow-name-delete"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Enter the workflow name{" "}
                <span className="font-bold">{workflow.name}</span> to continue:
              </FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
      <div className="flex justify-between">
        <Button variant="secondary" onClick={closeModal}>
          Cancel
        </Button>
        <SubmitButton
          isSubmitting={isPending}
          variant="destructive"
          type="submit"
          form="workflow-delete"
        >
          Delete
        </SubmitButton>
      </div>
    </Form>
  );
};
