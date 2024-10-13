import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import { type TaskFile } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { useMutation } from "@tanstack/react-query";
import { FileTextIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import DropzoneLib, { type DropzoneProps } from "react-dropzone";
import { toast } from "sonner";
import { deleteFilesFromTask, saveFileInTask } from "../../../_file_actions";

type useTaskFileTemporalUploaderProps = {
  taskId: string;
  savedFiles: TaskFile[];
  dropzone?: Omit<DropzoneProps, "onDrop" | "multiple">;
};

export const useTaskFileTemporalUploader = ({
  dropzone,
  taskId,
  savedFiles,
}: useTaskFileTemporalUploaderProps) => {
  const [temporalFiles, setTemporalFiles] = useState<
    { file: File; id: number; url?: string }[]
  >([]);

  const apiUtils = api.useUtils();

  const { mutate: deleteSavedFile } = useMutation({
    mutationFn: deleteFilesFromTask,
    onMutate: async (taskFileId) => {
      const prevTaskConfigurationData =
        apiUtils.manageWorkflow.getTaskConfiguration.getData(taskId);

      apiUtils.manageWorkflow.getTaskConfiguration.setData(
        taskId,
        (prevData) => {
          if (!prevData) return;

          return {
            ...prevData,
            files: prevData.files.filter((f) => f.id !== taskFileId),
          };
        },
      );

      return { prevTaskConfigurationData };
    },
    onError: (_, __, ctx) => {
      apiUtils.manageWorkflow.getTaskConfiguration.setData(
        taskId,
        ctx?.prevTaskConfigurationData,
      );

      toast.error("Error while deleting");
    },
  });

  const { mutate: uploadFileToTask, isPending: isUploadingFileToTask } =
    useMutation({
      mutationFn: async () => {
        if (temporalFiles.length === 0) return null;

        const formData = new FormData();

        formData.append("taskId", taskId);
        temporalFiles.forEach(({ file }) => {
          formData.append("files[]", file);
        });

        return await saveFileInTask(formData);
      },
      onError: () => {
        toast.error("Error while uploading");
      },
      onSuccess: async (files) => {
        if (!files) {
          return;
        }

        await apiUtils.manageWorkflow.getTaskConfiguration.cancel(taskId);

        apiUtils.manageWorkflow.getTaskConfiguration.setData(
          taskId,
          (prevData) => {
            if (!prevData) return;

            return {
              ...prevData,
              files: [...prevData.files, ...files],
            };
          },
        );

        setTemporalFiles([]);

        void apiUtils.manageWorkflow.getTaskConfiguration.invalidate(taskId, {
          predicate: ({ state }) => !state.data,
        });
      },
    });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const state = [] as typeof temporalFiles;

    acceptedFiles.forEach((file: File, idx) => {
      state.push({
        file,
        id: idx,
        url: file.type.startsWith("image")
          ? URL.createObjectURL(file)
          : undefined,
      });
    });

    setTemporalFiles((prev) => [...prev, ...state]);
  }, []);

  const Dropzone = () => (
    <DropzoneLib onDrop={onDrop} multiple {...dropzone}>
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
    </DropzoneLib>
  );

  const FilesRendered = () => (
    <div className="grid grid-cols-3 gap-2">
      {savedFiles.map(({ id, fileUrl, fileType }) => (
        <FileRenderer
          key={id}
          url={fileUrl}
          isImage={fileType.startsWith("image")}
          deleteFile={() => deleteSavedFile(id)}
        />
      ))}
      {temporalFiles.map(({ url, id, file }) => (
        <FileRenderer
          key={id}
          url={url}
          isImage={file.type.startsWith("image")}
          deleteFile={() =>
            setTemporalFiles((prev) => prev.filter((data) => data.id !== id))
          }
          className="opacity-50"
        />
      ))}
    </div>
  );

  return {
    Dropzone,
    FilesRendered,
    uploadFileToTask,
    isUploadingFileToTask,
  };
};

type FileRendererProps = {
  url?: string;
  isImage: boolean;
  deleteFile: () => void;
} & React.ComponentPropsWithoutRef<"div">;

export const FileRenderer = ({
  url,
  deleteFile,
  isImage,
  className,
  ...props
}: FileRendererProps) => {
  const [isLoadingImage, setIsLoadingImage] = useState(isImage && url);

  if (isImage && url)
    return (
      <div
        className={cn("relative aspect-square rounded-md", className)}
        {...props}
      >
        <button
          type="button"
          className="absolute -right-1 -top-1 z-10 rounded-lg bg-destructive p-1 text-destructive-foreground"
          onClick={deleteFile}
        >
          <XIcon className="size-4" />
        </button>
        <Image
          src={url}
          alt="user-image"
          width={100}
          height={100}
          className="size-full"
          onLoadingComplete={() => setIsLoadingImage(false)}
        />
        {isLoadingImage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        )}
      </div>
    );

  return (
    <div
      className={cn(
        "relative flex aspect-square items-center justify-center rounded-md bg-primary/10",
        className,
      )}
      {...props}
    >
      <button
        type="button"
        className="absolute -right-1 -top-1 z-10 rounded-lg bg-destructive p-1 text-destructive-foreground"
        onClick={deleteFile}
      >
        <XIcon className="size-4" />
      </button>
      <FileTextIcon className="text-primary" />
    </div>
  );
};
