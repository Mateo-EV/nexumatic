"use client";

import { useForm } from "@/hooks/useForm";
import { loginUserSchema, type loginUserSchemaType } from "@/schemas";
import {
  Form,
  FormControl,
  FormField,
  FormInput,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ButtonWithLoading } from "../ui/button";
import { authenticate } from "@/server/actions";

export const AuthForm = () => {
  const form = useForm<loginUserSchemaType>({
    schema: loginUserSchema,
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onSubmit = async (values: loginUserSchemaType) => {
    startTransition(() => {
      authenticate(values)
        .then((data) => {
          toast.success(data);
          router.push("/dashboard");
        })
        .catch((err: Error) => toast.error(err.message));
    });
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <FormInput
                    placeholder="Correo electrónico"
                    {...field}
                    className="border-gray-200 bg-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <FormInput
                    placeholder="Contraseña"
                    {...field}
                    className="border-gray-200 bg-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <ButtonWithLoading
            isLoading={isPending}
            type="submit"
            className="w-min self-end"
          >
            Iniciar Sesión
          </ButtonWithLoading>
        </div>
      </form>
    </Form>
  );
};
