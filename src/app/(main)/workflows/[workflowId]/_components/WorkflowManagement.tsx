import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { WorkflowEditor } from "./WorkflowEditor";
import { WorkflowManagementMenu } from "./WorkflowManagementMenu";
import { WorkflowLogs } from "./WorkflowLogs";
import WorkflowManagementMenuMobile from "./WorkflowManagementMenuMobile";

export const WorkflowManagement = () => {
  return (
    <>
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel minSize={15} className="hidden lg:block">
          <WorkflowManagementMenu />
        </ResizablePanel>
        <ResizableHandle className="hidden lg:flex" />
        <ResizablePanel minSize={40} defaultSize={70}>
          <WorkflowEditor />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel minSize={15} className="hidden lg:block">
          <WorkflowLogs />
        </ResizablePanel>
      </ResizablePanelGroup>
      <WorkflowManagementMenuMobile />
    </>
  );
};
