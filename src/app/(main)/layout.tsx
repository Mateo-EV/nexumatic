import { getSession } from "@/server/session";
import { redirect } from "next/navigation";
import { Navbar } from "./_components/Navbar";
import { TRPCReactProvider } from "@/trpc/react";
import { AuthProvider } from "@/providers/AuthProvider";
import { Toaster } from "@/components/ui/sonner";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) redirect("/");

  return (
    <AuthProvider session={session}>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="pt-8">
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </div>
      </div>
      <Toaster position="top-center" />
    </AuthProvider>
  );
}
