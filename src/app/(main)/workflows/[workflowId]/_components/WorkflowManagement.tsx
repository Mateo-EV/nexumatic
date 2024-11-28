"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { WorkflowEditor } from "./WorkflowEditor";
import { WorkflowManagementMenu } from "./WorkflowManagementMenu";
import { WorkflowLogs } from "./WorkflowLogs";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type PanelType = "management" | "editor" | "logs";

export const WorkflowManagement = () => {
  const [activePanel, setActivePanel] = useState<PanelType>("editor");

  const renderMobilePanel = () => {
    switch (activePanel) {
      case "management":
        return <WorkflowManagementMenu />;
      case "editor":
        return <WorkflowEditor />;
      case "logs":
        return <WorkflowLogs />;
    }
  };

  return (
    <div className="w-full">
      {/* Mobile view */}
      <div className="flex h-screen flex-col md:hidden">
        <div className="flex justify-between p-2">
          <Button
            onClick={() => setActivePanel("management")}
            variant={activePanel === "management" ? "default" : "outline"}
          >
            Management
          </Button>
          <Button
            onClick={() => setActivePanel("editor")}
            variant={activePanel === "editor" ? "default" : "outline"}
          >
            Editor
          </Button>
          <Button
            onClick={() => setActivePanel("logs")}
            variant={activePanel === "logs" ? "default" : "outline"}
          >
            Logs
          </Button>
        </div>
        <div className="flex-grow overflow-auto">{renderMobilePanel()}</div>
      </div>

      {/* Desktop view */}
      <div className="hidden h-full md:block">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel minSize={15}>
            <WorkflowManagementMenu />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel minSize={40} defaultSize={70}>
            <WorkflowEditor />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel minSize={15}>
            <WorkflowLogs />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};
