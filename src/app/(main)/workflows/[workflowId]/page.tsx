import { WorkflowProvider } from "@/providers/WorkflowProvider";
import { getAvailableServicesForUser } from "@/server/db/data";
import { api } from "@/trpc/server";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { WorkflowManagement } from "./_components/WorkflowManagement";

export default async function WorkflowIdPage({
  params: { workflowId },
}: {
  params: { workflowId: string };
}) {
  const workflow = await api.workflow.getById(workflowId);

  if (!workflow) redirect("/");

  // revalidateTag("services");
  const services = await getAvailableServicesForUser();

  return (
    <main className="flex h-[calc(100vh-6.7rem)] flex-col">
      <div
        className="sticky top-0 flex items-end border-b bg-background/50 px-6 pt-8 backdrop-blur-lg"
        style={{ viewTransitionName: `workflow-container-${workflow.id}` }}
      >
        <div className="pb-4">
          <h1
            className="text-4xl"
            style={{ viewTransitionName: `workflow-name-${workflow.id}` }}
          >
            {workflow.name}
          </h1>
          {workflow.description && (
            <h2
              className="text-muted-foreground"
              style={{
                viewTransitionName: `workflow-description-${workflow.id}`,
              }}
            >
              {workflow.description}
            </h2>
          )}
        </div>
      </div>
      <section className="flex-1">
        <WorkflowProvider services={services} workflow={workflow}>
          <WorkflowManagement />
        </WorkflowProvider>
      </section>
    </main>
  );
}
