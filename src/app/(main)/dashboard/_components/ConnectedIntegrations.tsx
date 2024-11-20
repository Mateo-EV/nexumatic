import { Icons } from "@/components/Icons";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type Connection, type Service } from "@/server/db/schema";
import { PlusIcon } from "lucide-react";
import { Link } from "next-view-transitions";

type ConnectedIntegrationsProps = {
  connections: Array<Connection & { services: Service }>;
};

const Icon = ({ service }: { service: Service }) => {
  const Comp = Icons.services[service.name];
  return <Comp className="h-12 w-12" />;
};

export const ConnectedIntegrations = ({
  connections,
}: ConnectedIntegrationsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Integrations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid w-full grid-cols-3 gap-4">
          {connections.map((connection) => (
            <div
              className="flex flex-col items-center gap-2"
              key={connection.id}
            >
              <Icon service={connection.services} />
              <span className="text-sm">{connection.services.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Link
          href="/connections"
          className={buttonVariants({
            variant: "outline",
            className: "w-full",
          })}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Integration
        </Link>
      </CardFooter>
    </Card>
  );
};
