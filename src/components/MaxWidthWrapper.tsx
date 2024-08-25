import { cn } from "@/lib/utils";

type MaxWidthWrapperProps = React.ComponentPropsWithoutRef<"div"> & {
  large?: boolean;
};

export const MaxWidthWrapper = ({
  className,
  children,
  large = false,
}: MaxWidthWrapperProps) => {
  return (
    <div
      className={cn(
        "container",
        large ? "max-w-screen-2xl" : "max-w-6xl",
        className,
      )}
    >
      {children}
    </div>
  );
};
