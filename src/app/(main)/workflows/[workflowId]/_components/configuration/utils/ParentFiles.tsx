"use client";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import { type TaskFile } from "@/server/db/schema";
import { FileTextIcon, PlusIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useTaskParentsConfiguration } from "./useTaskParentConfigurations";

type ParentFilesProps = {
  taskId: string;
  extraFiles: number[];
  setExtraFiles: React.Dispatch<React.SetStateAction<number[]>>;
};

export const ParentFiles = ({
  taskId,
  extraFiles,
  setExtraFiles,
}: ParentFilesProps) => {
  const { queries, isLoading } = useTaskParentsConfiguration(taskId);

  if (isLoading) {
    return <LoadingSpinner className="" />;
  }

  const files = queries.flatMap(({ data }) => data!.files);

  return (
    <ParentFilesLoaded
      initialFiles={files}
      extraFiles={extraFiles}
      setExtraFiles={setExtraFiles}
    />
  );
};

const ParentFilesLoaded = ({
  initialFiles,
  extraFiles,
  setExtraFiles,
}: {
  initialFiles: TaskFile[];
  extraFiles: number[];
  setExtraFiles: React.Dispatch<React.SetStateAction<number[]>>;
}) => {
  function omitFile(fileId: number) {
    setExtraFiles((prev) => prev.filter((f) => f !== fileId));
  }

  function addFile(fileId: number) {
    setExtraFiles((prev) => [...prev, fileId]);
  }

  if (initialFiles.length === 0) return;

  return (
    <div className="grid grid-cols-3 gap-2">
      {initialFiles.map((file) => (
        <ParentFilesRenderer
          file={file}
          key={file.id}
          isOmitted={!extraFiles.includes(file.id)}
          omitFile={omitFile}
          addFile={addFile}
        />
      ))}
    </div>
  );
};

type ParentFilesRendererProps = {
  file: TaskFile;
  isOmitted: boolean;
  omitFile: (f: number) => void;
  addFile: (f: number) => void;
};

const ParentFilesRenderer = ({
  file,
  isOmitted,
  addFile,
  omitFile,
}: ParentFilesRendererProps) => {
  const isImage = file.fileType.startsWith("image");
  const [isLoadingImage, setIsLoadingImage] = useState(isImage);

  const ActionButton = () => {
    const handleClick = () => {
      if (isOmitted) addFile(file.id);
      else omitFile(file.id);
    };

    return (
      <button
        type="button"
        className={cn(
          "absolute -right-1 -top-1 z-10 rounded-lg p-1",
          isOmitted
            ? "bg-primary text-foreground"
            : "bg-destructive text-destructive-foreground",
        )}
        onClick={handleClick}
      >
        {isOmitted ? (
          <PlusIcon className="size-4" />
        ) : (
          <XIcon className="size-4" />
        )}
      </button>
    );
  };

  if (isImage)
    return (
      <div className="relative aspect-square rounded-md">
        <Image
          src={file.fileUrl}
          alt="user-image"
          width={100}
          height={100}
          className={cn(
            "size-full rounded-md",
            isOmitted ? "opacity-60" : "opacity-100",
          )}
          onLoadingComplete={() => setIsLoadingImage(false)}
        />
        <ActionButton />
        {isLoadingImage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        )}
      </div>
    );

  return (
    <div className="relative flex aspect-square items-center justify-center rounded-md bg-primary/10">
      <FileTextIcon
        className={`text-primary ${isOmitted ? "opacity-60" : "opacity-100"}`}
      />
      <ActionButton />
    </div>
  );
};
