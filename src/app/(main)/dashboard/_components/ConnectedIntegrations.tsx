import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusIcon } from "lucide-react";

type ConnectedIntegrationsProps = {};

export const ConnectedIntegrations = ({}: ConnectedIntegrationsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Integrations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-lg bg-primary/10" />
            <span className="text-sm">Google Drive</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-lg bg-primary/10" />
            <span className="text-sm">Slack</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-lg bg-primary/10" />
            <span className="text-sm">Notion</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant="outline">
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Integration
        </Button>
      </CardFooter>
    </Card>
  );
};
