import { AuthProvider } from "@/providers/AuthProvider";
import { getSession } from "@/server/session";
import { TRPCReactProvider } from "@/trpc/react";
import { redirect } from "next/navigation";
import "reactflow/dist/style.css";
import { Navbar } from "./_components/Navbar";
import WorkflowNotifications from "./_components/WorkflowNotifications";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) redirect("/");

  return (
    <AuthProvider session={session}>
      <Navbar />
      <TRPCReactProvider>
        {children}
        <WorkflowNotifications />
      </TRPCReactProvider>
    </AuthProvider>
  );
}
