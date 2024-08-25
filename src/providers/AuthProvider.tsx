"use client";

import { type Session } from "next-auth";
import { createContext, useContext } from "react";

const AuthContext = createContext<Session | null>(null);

export const AuthProvider = ({
  session,
  children,
}: {
  session: Session;
  children: React.ReactNode;
}) => {
  return (
    <AuthContext.Provider value={session}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext)!;
