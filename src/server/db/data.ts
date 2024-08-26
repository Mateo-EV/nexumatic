import "server-only";
import { unstable_cache } from "next/cache";
import { db } from ".";

export const getAvailableServicesForUser = unstable_cache(
  async () => {
    return await db.query.services.findMany({
      columns: { id: true, name: true },
    });
  },
  ["services"],
  { tags: ["services"] },
);
