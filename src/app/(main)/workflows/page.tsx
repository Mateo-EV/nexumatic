import { WorkflowButton } from "./_components/WorkflowButton";
import { Workflows } from "./_components/Workflows";

export default function WorkflowsPage() {
  return (
    <main className="container relative flex flex-col pt-8">
      <div className="sticky top-0 flex items-center justify-between border-b bg-background/50 p-6 backdrop-blur-lg">
        <h1 className="text-4xl">Workflows</h1>
        <WorkflowButton />
      </div>
      <section className="flex flex-col gap-4 py-4">
        <Workflows />
      </section>
    </main>
  );
}
