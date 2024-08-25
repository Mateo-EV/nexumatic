import { Suspense } from "react";
import { WorkflowButton } from "./_components/WorkflowButton";
import { Workflows } from "./_components/Workflows";
import { api } from "@/trpc/server";
import { Skeleton } from "@/components/ui/skeleton";

export default function WorkflowsPage() {
  return (
    <main className="container relative flex flex-col">
      <div className="sticky top-0 flex items-center justify-between border-b bg-background/50 p-6 backdrop-blur-lg">
        <h1 className="text-4xl">Workflows</h1>
        <WorkflowButton />
      </div>
      <section className="flex flex-col gap-4 py-4">
        <Suspense fallback={<WorkflowsSkeleton />}>
          <WorkflowsServer />
        </Suspense>
      </section>
    </main>
  );
}

async function WorkflowsServer() {
  const workflows = await api.workflow.getAllFromUser();

  return <Workflows initialData={workflows} />;
}

function WorkflowsSkeleton() {
  const workflow = <Skeleton className="h-20 w-full" />;

  return (
    <>
      {workflow}
      {workflow}
      {workflow}
    </>
  );
}
