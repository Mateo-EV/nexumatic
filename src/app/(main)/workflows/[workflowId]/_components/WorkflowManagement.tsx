import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { WorkflowEditor } from "./WorkflowEditor";
import { WorkflowManagementMenu } from "./WorkflowManagementMenu";

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
      <ResizablePanel minSize={15}>Logs</ResizablePanel>
    </ResizablePanelGroup>
  );
};
