import { NextAuthProvider } from "@/providers/NextAuthProvider";
import { Navbar } from "./_components/Navbar";
import LoginModalProvider from "@/providers/LoginModalProvider";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LoginModalProvider>
      <NextAuthProvider refetchOnWindowFocus={false}>
        <Navbar />
        <main>{children}</main>
      </NextAuthProvider>
    </LoginModalProvider>
  );
}
