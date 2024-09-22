"use client";

import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  type ConnectionConfiguration,
  type ServicesMethods,
} from "@/server/db/schema";
import { type RouterOutputs } from "@/trpc/react";

export const ConfigurationDetails = {
  Discord: (connection) => {
    const servers =
      connection.configuration! as ConnectionConfiguration["Discord"]["postMessage"];

    return (
      <DropdownMenuContent>
        <DropdownMenuLabel>Servers</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {servers.map(({ guildName, guildId }) => (
            <DropdownMenuItem key={guildId}>{guildName}</DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    );
  },
} as Record<
  keyof ServicesMethods,
  (
    connection: RouterOutputs["connection"]["getAllFromUser"][string],
  ) => JSX.Element
>;
