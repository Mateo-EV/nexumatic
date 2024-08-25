import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import { EditorCanvas } from "./_components/EditorCanvas";

export default async function WorkflowIdPage({
  params: { workflowId },
}: {
  params: { workflowId: string };
}) {
  const workflow = await api.workflow.getById(workflowId);

  if (!workflow) redirect("/");

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
        <EditorCanvas />
      </section>
    </main>
  );
}
