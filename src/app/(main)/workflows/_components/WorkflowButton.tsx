"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCallback, useState } from "react";
import { WorkflowForm } from "./WorkflowForm";

export const WorkflowButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Create workflow</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new workflow</DialogTitle>
          <DialogDescription>
            Start automating your tasks quickly and easily
          </DialogDescription>
        </DialogHeader>
        <WorkflowForm closeModal={closeModal} />
      </DialogContent>
    </Dialog>
  );
};
