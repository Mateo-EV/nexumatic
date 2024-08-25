"use client";

import { SessionProvider, type SessionProviderProps } from "next-auth/react";

export const NextAuthProvider = ({
  children,
  ...props
}: SessionProviderProps) => {
  return <SessionProvider {...props}>{children}</SessionProvider>;
};
