import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export function createObject(formData: FormData) {
  const entries: Record<string, unknown> = {};

  formData.forEach((value, key) => {
    const cleanKey = key.replace("[]", "");

    if (key.includes("[]")) {
      if (!entries[cleanKey]) {
        entries[cleanKey] = [];
      }
      (entries[cleanKey] as unknown[]).push(value);
    } else {
      entries[cleanKey] = value;
    }
  });

  return entries;
}
