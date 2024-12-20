"use client";

import { Icons } from "@/components/Icons";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { type ServiceClient } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { ConnectionButton, ReConnectionButton } from "./ConnectionButton";

type ConnectionCardProps = {
  service: ServiceClient;
};

export const ConnectionCard = ({ service }: ConnectionCardProps) => {
  const Icon = Icons.services[service.name];

  const { data: connections, isPending } =
    api.connection.getAllFromUser.useQuery();

  const connection = connections?.[service.id];

  return (
    <Card className="relative flex w-full items-center justify-between">
      {!isPending && (
        <>
          <div
            className={cn(
              "absolute left-3 top-4 size-2 animate-pulse rounded-full",
              connection ? "bg-green-500" : "bg-red-500",
            )}
          />
          <div
            className={cn(
              "absolute left-3 top-4 size-2 animate-ping rounded-full",
              connection ? "bg-green-500" : "bg-red-500",
            )}
          />
        </>
      )}
      <CardHeader className="flex-row items-center gap-4">
        <Icon className="size-8" />
        <div>
          <CardTitle className="text-lg">{service.name}</CardTitle>
          <CardDescription>
            Connect to your {service.name} account
          </CardDescription>
        </div>
      </CardHeader>
      <div className="flex flex-col items-center gap-2 p-4">
        {isPending ? (
          <Skeleton className="h-10 w-32 rounded-md" />
        ) : connection ? (
          <ReConnectionButton serviceName={service.name} />
        ) : (
          <ConnectionButton serviceName={service.name} />
        )}
      </div>
    </Card>
  );
};
