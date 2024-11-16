import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";

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

export function formatDateForLogs(date: Date) {
  const dateDifferenceInTime = new Date().getTime() - date.getTime();
  const dateDifferenceInDays = dateDifferenceInTime / (1000 * 60 * 60 * 24);

  if (dateDifferenceInDays < 1) return dayjs(date).format("h:mm a");

  if (dateDifferenceInDays < 2)
    return "Yesterday · " + dayjs(date).format("h:mm a");

  if (dateDifferenceInDays <= 6) return dayjs(date).format("dddd · h:mm a");

  return dayjs(date).format("DD/MM/YYYY · h:mm a");
}

export function formatExpiresAt(expiresIn: number) {
  return new Date((Math.floor(Date.now() / 1000) + expiresIn) * 1000);
}

export function eventManager() {
  const events: Array<() => Promise<unknown>> = [];
  let executing = false;

  return async (cb: () => Promise<unknown>) => {
    events.push(cb);

    if (!executing) {
      executing = true;
      while (events.length) {
        await events.shift()!();
      }
      executing = false;
    }
  };
}
