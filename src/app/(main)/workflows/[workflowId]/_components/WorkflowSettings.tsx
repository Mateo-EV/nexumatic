/* eslint-disable @typescript-eslint/no-unsafe-call */
"use client";

import { Button, SubmitButton } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AutosizeTextarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWorkflow } from "@/providers/WorkflowProvider";
import { type ServiceClient, type ServicesMethods } from "@/server/db/schema";
import { FileTextIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import Dropzone from "react-dropzone";
import { toast } from "sonner";
import { saveWorkflowTemplate } from "../_actions";
import { useMutation } from "@tanstack/react-query";

export const WorkflowSettings = () => {
  const {
    editor: { selectedNode },
  } = useWorkflow();

  return (
    <Tabs defaultValue="workflow">
      <TabsList className="grid w-full grid-cols-2 rounded-none">
        <TabsTrigger value="workflow">Workflow</TabsTrigger>
        <TabsTrigger value="task" disabled={!selectedNode}>
          Task
        </TabsTrigger>
      </TabsList>
      <TabsContent value="workflow" className="p-2 px-4">
        <WorkflowGeneralSettings />
      </TabsContent>
      <TabsContent value="task">
        {selectedNode && <ServiceSettings {...selectedNode.data} />}
      </TabsContent>
    </Tabs>
  );
};

const WorkflowGeneralSettings = () => {
  const { workflow } = useWorkflow();
  const [filesClient, setFilesClient] = useState<
    { file: File; id: string; url?: string }[]
  >([]);
  const [filesSaved, setFilesSaved] = useState<string[]>([]);

  useEffect(() => {
    setFilesSaved(workflow.template?.files ?? []);
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const filesState = acceptedFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      isLoading: false,
    }));
    setFilesClient((prev) => [...prev, ...filesState]);

    acceptedFiles.forEach((file: File, i) => {
      if (!file.type.startsWith("image")) return;

      const fileReader = new FileReader();
      fileReader.addEventListener("load", () => {
        setFilesClient((prev) =>
          prev.map((fileData, idx) => {
            if (idx === i)
              return {
                ...fileData,
                url: fileReader.result as string,
              };

            return fileData;
          }),
        );
      });

      fileReader.readAsDataURL(file);
    });
  }, []);

  const { mutate: saveTemplate, isPending } = useMutation({
    mutationFn: saveWorkflowTemplate,
    onError: () => {
      toast.error("Something went wrong");
    },
    onSuccess: () => {
      toast.success("Template saved succesfully");
    },
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append("workflowId", workflow.id);
    filesClient.forEach(({ file }) => {
      formData.append("files", file);
    });

    saveTemplate(formData);
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <h2 className="text-center font-semibold">Template</h2>
      <div className="space-y-2">
        <Label>Content</Label>
        <AutosizeTextarea
          placeholder="Write content to share across the workflow"
          maxHeight={100}
          name="content"
          defaultValue={workflow.template?.content}
        />
      </div>
      <div className="space-y-2">
        <Label>File</Label>
        <TooltipProvider>
          {filesClient.map(({ id, file, url }) => {
            const isImage = file.type.startsWith("image");

            const content = (
              <div
                key={id}
                onClick={(e) => e.stopPropagation()}
                className="flex w-full items-center gap-2 rounded-md bg-primary/10 p-2"
              >
                <div className="aspect-square size-4">
                  <FileTextIcon className="size-full text-primary" />
                </div>
                <span className="truncate text-sm text-foreground">
                  {file.name}
                </span>
                <div className="ml-auto">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      setFilesClient((prev) =>
                        prev.filter((file) => file.id !== id),
                      )
                    }
                  >
                    <XIcon className="size-4" />
                  </Button>
                </div>
              </div>
            );

            if (isImage)
              return (
                <Tooltip key={id}>
                  <TooltipTrigger asChild>{content}</TooltipTrigger>
                  <TooltipContent>
                    {url ? (
                      <img src={url} alt={file.name} className="max-w-80" />
                    ) : (
                      <LoadingSpinner />
                    )}
                  </TooltipContent>
                </Tooltip>
              );

            return content;
          })}
        </TooltipProvider>
        <Dropzone onDrop={onDrop} multiple>
          {({ getRootProps, getInputProps }) => (
            <div
              className="cursor-pointer rounded-md border-4 border-dotted border-primary px-4 py-8"
              {...getRootProps()}
            >
              <input {...getInputProps()} />
              <p className="text-center text-sm text-muted-foreground">
                Drag and drop some files here, or click to select files
              </p>
            </div>
          )}
        </Dropzone>
      </div>
      <SubmitButton isSubmitting={isPending}>Save</SubmitButton>
    </form>
  );
};

const ServiceSettings = (data: ServiceClient) => {
  const Configuration = ServicesSpecificConfigurations[data.name][
    data.method as never
  ] as (props: ServiceClient) => JSX.Element;

  return <Configuration {...data} />;
};

const ServicesSpecificConfigurations = {
  Discord: {
    postMessage: ({ name }) => {
      return <div></div>;
    },
  },
  "Google Drive": {
    listenFilesAdded: ({}) => {
      return <div></div>;
    },
  },
} as ServicesMethods<(props: ServiceClient) => JSX.Element>;
