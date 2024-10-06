import { SubmitButton } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AutosizeTextarea } from "@/components/ui/textarea";
import { type NodeData, useWorkflow } from "@/providers/WorkflowProvider";
import { useMutation, useQueries } from "@tanstack/react-query";
import { FileTextIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import Dropzone from "react-dropzone";
import { toast } from "sonner";
import { saveManualTriggerTemplate } from "../../_actions";

async function urlToFile(url: string) {
  const response = await fetch(url);

  const contentType =
    response.headers.get("Content-Type") ?? "application/octet-stream";

  let filename = "default_filename";
  const disposition = response.headers.get("Content-Disposition");
  if (disposition?.includes("filename")) {
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const matches = filenameRegex.exec(disposition);
    if (matches?.[1]) {
      filename = matches[1].replace(/['"]/g, "");
    }
  } else {
    filename = url.split("/").pop() ?? filename;
  }

  const blob = await response.blob();
  const file = new File([blob], filename, { type: contentType });

  return { file, blob };
}

type ManualTriggerClickButtonProps = { data: NodeData };

export const ManualTriggerClickButton = ({
  data,
}: ManualTriggerClickButtonProps) => {
  const { workflow } = useWorkflow();
  const [temporalFiles, setTemporalFiles] = useState<
    { file: File; id: number; url?: string }[]
  >([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file: File, idx) => {
      const state = {
        file,
        id: idx,
        url: undefined,
      } as (typeof temporalFiles)[number];

      if (file.type.startsWith("image")) {
        state.url = URL.createObjectURL(file);
      }

      setTemporalFiles((prev) => [...prev, state]);
    });
  }, []);

  const { mutate: save, isPending } = useMutation({
    mutationFn: saveManualTriggerTemplate,
    onError: () => {
      toast.error("Something went wrong");
    },
    onSuccess: () => {
      toast.success("Configuration saved succesfully");
    },
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append("workflowId", workflow.id);
    formData.append("taskId", data.id);
    temporalFiles.forEach(({ file }) => {
      formData.append("files[]", file);
    });

    save(formData);
  };

  return (
    <form className="space-y-4 p-2" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label>Content</Label>
        <AutosizeTextarea
          placeholder="Write content to share across the workflow"
          maxHeight={100}
          name="content"
          defaultValue={data.configuration?.content}
        />
      </div>
      <div className="space-y-2">
        <Label>Files</Label>
        <div className="grid grid-cols-3 gap-2">
          {temporalFiles.map(({ url, id }) => (
            <FileRenderer
              key={id}
              url={url}
              deleteFile={() =>
                setTemporalFiles((prev) =>
                  prev.filter((data) => data.id !== id),
                )
              }
            />
          ))}
        </div>
        <Dropzone onDrop={onDrop} multiple>
          {({ getRootProps, getInputProps }) => (
            <div
              className="cursor-pointer rounded-md border-4 border-dotted border-primary px-4 py-8"
              {...getRootProps()}
            >
              <input {...getInputProps()} />
              <p className="text-center text-sm text-muted-foreground">
                Drag and drop some files here, or click to add files
              </p>
            </div>
          )}
        </Dropzone>
      </div>
      <SubmitButton isSubmitting={isPending}>Save</SubmitButton>
    </form>
  );
};

type FileRendererProps = {
  url?: string;
  deleteFile: () => void;
};

const FileRenderer = ({ url, deleteFile }: FileRendererProps) => {
  if (url)
    return (
      <div className="relative aspect-square rounded-md">
        <button
          className="absolute -right-1 -top-1 z-10 rounded-lg bg-destructive p-1 text-destructive-foreground"
          onClick={deleteFile}
        >
          <XIcon className="size-4" />
        </button>
        <Image src={url} alt="user-image" fill />
      </div>
    );

  return (
    <div className="relative flex aspect-square items-center justify-center rounded-md bg-primary/10">
      <button
        className="absolute -right-1 -top-1 z-10 rounded-lg bg-destructive p-1 text-destructive-foreground"
        onClick={deleteFile}
      >
        <XIcon className="size-4" />
      </button>
      <FileTextIcon className="text-primary" />
    </div>
  );
};
