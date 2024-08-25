import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export const EditorCanvas = () => {
  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel minSize={15}>Menu</ResizablePanel>
      <ResizableHandle />
      <ResizablePanel minSize={40}>Canvas</ResizablePanel>
      <ResizableHandle />
      <ResizablePanel minSize={15}>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel>Logs</ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>Settings</ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
