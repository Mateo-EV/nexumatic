import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { WorkflowManagementMenu } from "./WorkflowManagementMenu";
import { WorkflowEditor } from "./WorkflowEditor";

export const WorkflowManagement = () => {
  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel minSize={15}>
        <WorkflowManagementMenu />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel minSize={40} defaultSize={70}>
        <WorkflowEditor />
      </ResizablePanel>
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
