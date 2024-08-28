import "server-only";
import { unstable_cache } from "next/cache";
import { db } from ".";

export const getAvailableServicesForUser = unstable_cache(
  async () => {
    const services = await db.query.services.findMany({
      columns: { id: true, name: true, method: true, type: true },
    });

    return services.reduce(
      (acc, curr) => {
        if (curr.type === "action") {
          acc.indexedByType.actions.push(curr);
        } else {
          acc.indexedByType.triggers.push(curr);
        }

        acc.indexedById[curr.id] = curr;

        return acc;
      },
      {
        indexedByType: {
          actions: [],
          triggers: [],
        },
        indexedById: {},
      } as {
        indexedByType: {
          actions: typeof services;
          triggers: typeof services;
        };
        indexedById: Record<string, (typeof services)[number]>;
      },
    );
  },
  ["services"],
  { tags: ["services"] },
);
