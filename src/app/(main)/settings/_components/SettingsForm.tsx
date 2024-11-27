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
import { profileSchema } from "@/lib/validators/both";
import { useAuth } from "@/providers/AuthProvider";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";

export default function SettingsForm() {
  const { user } = useAuth();
  const form = useForm({
    schema: profileSchema,
    defaultValues: { name: user.name },
  });
  const router = useRouter();
  const { mutate: updateProfile, isPending } =
    api.profile.updateProfile.useMutation({
      onSuccess: (_, { name }) => {
        router.refresh();
        form.reset({
          name,
        });
      },
    });

  const handleSubmit = form.handleSubmit((value) => {
    updateProfile(value);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <SubmitButton
          isSubmitting={isPending}
          disabled={!form.formState.isDirty}
          className="ml-auto block"
        >
          Save
        </SubmitButton>
      </form>
    </Form>
  );
}
