import { NextAuthProvider } from "@/providers/NextAuthProvider";
import { Navbar } from "./_components/Navbar";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextAuthProvider refetchOnWindowFocus={false}>
      <Navbar />
      <main>{children}</main>
    </NextAuthProvider>
  );
}
