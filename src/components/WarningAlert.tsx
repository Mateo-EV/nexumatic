import { cn } from "@/lib/utils";
import { TriangleAlertIcon } from "lucide-react";

type WarningProps = React.ComponentPropsWithoutRef<"div">;

export const WarningAlert = ({
  className,
  children,
  ...props
}: WarningProps) => {
  return (
    <div
      className={cn(
        "flex items-center justify-start gap-2 rounded bg-destructive/10 p-2 text-sm text-destructive",
        className,
      )}
      {...props}
    >
      <TriangleAlertIcon className="size-4" />
      {children}
    </div>
  );
};
