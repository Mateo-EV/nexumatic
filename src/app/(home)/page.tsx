import { MaxWidthWrapper } from "@/components/MaxWidthWrapper";
import { Button } from "@/components/ui/button";

export default async function Home() {
  return (
    <MaxWidthWrapper className="mt-28 flex flex-col items-center justify-center text-center">
      <Button variant="outline" size="sm" className="mb-4 rounded-full px-4">
        <span className="mr-2">🎉</span>Supercharge your workflow with NexuMatic
      </Button>
      <h1 className="max-w-4xl text-5xl font-bold md:text-6xl lg:text-7xl">
        Automate, Optimize, and Scale{" "}
        <span className="text-blue-500">your tasks</span> in seconds.
      </h1>
      <p className="mt-5 max-w-prose text-muted-foreground sm:text-lg">
        Build seamless automation pipelines using our cutting-edge platform.
        Integrate with tools like Google Drive, Slack, Notion, and more while
        managing everything in real-time with our intuitive dashboard.
      </p>
    </MaxWidthWrapper>
  );
}
