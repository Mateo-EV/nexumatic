"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm as useFormLib,
  type FieldValues,
  type UseFormProps,
} from "react-hook-form";
import { type z } from "zod";

type useFormProps<
  TFieldValues extends FieldValues = FieldValues,
  TContext = unknown,
> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: z.ZodType<TFieldValues, any, unknown>;
} & Omit<UseFormProps<TFieldValues, TContext>, "resolver">;

const useForm = <
  TFieldValues extends FieldValues = FieldValues,
  TContext = unknown,
  TTransformedValues extends FieldValues = TFieldValues,
>({
  schema,
  ...props
}: useFormProps<TFieldValues, TContext>) => {
  return useFormLib<TFieldValues, TContext, TTransformedValues>({
    resolver: zodResolver(schema),
    ...props,
  });
};

export default useForm;
