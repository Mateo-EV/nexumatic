"use client";

import { useMemo, useSyncExternalStore } from "react";

const createMediaQueryStore = (query: string) => {
  const mediaQueryList = window.matchMedia(query);

  return {
    subscribe: (callback: () => void) => {
      mediaQueryList.addEventListener("change", callback);
      return () => mediaQueryList.removeEventListener("change", callback);
    },
    getSnapshot: () => mediaQueryList.matches,
  };
};

export const useMediaQuery = (query: string): boolean => {
  const store = useMemo(() => createMediaQueryStore(query), [query]);

  return useSyncExternalStore(store.subscribe, store.getSnapshot);
};
