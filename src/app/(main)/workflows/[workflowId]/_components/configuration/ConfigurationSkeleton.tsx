import { Skeleton } from "@/components/ui/skeleton";

export const ConfigurationSkeleton = () => {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="mx-auto h-8 w-full" />
      <div className="space-y-4">
        <div>
          <Skeleton className="mb-2 h-6 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div>
          <Skeleton className="mb-2 h-6 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div>
          <Skeleton className="mb-2 h-6 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      <Skeleton className="mx-auto h-10 w-32" />
    </div>
  );
};
