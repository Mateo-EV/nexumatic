"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { useWorkflow } from "@/providers/WorkflowProvider";

type AcceptParentFilesProps = {
  value: boolean;
  setValue: (b: boolean) => void;
};

export const AcceptParentFiles = ({
  value,
  setValue,
}: AcceptParentFilesProps) => {
  const {
    editor: { nodes },
  } = useWorkflow();
  const nodeTrigger = nodes.find(
    (n) => n.data.service.method === "listenFilesAdded",
  );

  if (!nodeTrigger) return null;

  return (
    <div className="flex items-center space-x-2 py-2">
      <Checkbox id="include_files" checked={value} onCheckedChange={setValue} />
      <label htmlFor="include_files" className="text-xs leading-none">
        Include files from {nodeTrigger.data.service.name}
      </label>
    </div>
  );
};
