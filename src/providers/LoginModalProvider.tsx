"use client";

import { LoginModal } from "@/app/(home)/_components/LoginModal";
import { createContext, useContext, useState } from "react";

type LoginModalContextType = {
  setIsOpen: (state: boolean) => void;
  isOpen: boolean;
};

const LoginModalContext = createContext<LoginModalContextType>(null!);

export default function LoginModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <LoginModalContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
      <LoginModal isOpen={isOpen} setIsOpen={setIsOpen} />
    </LoginModalContext.Provider>
  );
}

export function useLoginModal() {
  return useContext(LoginModalContext);
}
