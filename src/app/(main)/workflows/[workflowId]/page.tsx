import { WorkflowProvider } from "@/providers/WorkflowProvider";
import { getAvailableServicesForUser } from "@/server/db/data";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import { WorkflowStateButton } from "../_components/WorkflowStateButton";
import { WorkflowManagement } from "./_components/WorkflowManagement";

export default async function WorkflowIdPage({
  params: { workflowId },
}: {
  params: { workflowId: string };
}) {
  const workflow = await api.workflow.getById(workflowId);

  if (!workflow) redirect("/");

  const services = await getAvailableServicesForUser();

  return (
    <main className="flex h-[calc(100vh-6.7rem)] flex-col">
      <div
        className="flex items-center justify-between border-b bg-background/50 p-6 backdrop-blur-lg"
        style={{ viewTransitionName: `workflow-container-${workflow.id}` }}
      >
        <div>
          <h1
            className="text-xl md:text-4xl"
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
        <WorkflowStateButton
          workflowId={workflowId}
          isActive={workflow.isActive}
        />
      </div>
      <section className="relative flex-1">
        <WorkflowProvider services={services} workflow={workflow}>
          <WorkflowManagement />
        </WorkflowProvider>
      </section>
    </main>
  );
}
