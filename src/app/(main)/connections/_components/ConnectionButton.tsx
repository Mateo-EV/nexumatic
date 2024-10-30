import { buttonVariants } from "@/components/ui/button";
import { LINKS_CONNECTIONS } from "@/config/const";
import { cn } from "@/lib/utils";

type ConnectionButtonProps = React.ComponentPropsWithoutRef<"a"> & {
  serviceName: keyof typeof LINKS_CONNECTIONS;
};

export const ConnectionButton = ({
  serviceName,
  className,
  ...props
}: ConnectionButtonProps) => {
  return (
    <a
      href={LINKS_CONNECTIONS[serviceName]}
      target="_blank"
      className={cn(buttonVariants(), className)}
      {...props}
    >
      Connect
    </a>
  );
};

export const ReConnectionButton = ({
  serviceName,
  className,
  ...props
}: ConnectionButtonProps) => {
  return (
    <a
      href={LINKS_CONNECTIONS[serviceName]}
      target="_blank"
      className={cn(buttonVariants({ variant: "secondary" }), className)}
      {...props}
    >
      Reconnect
    </a>
  );
};
