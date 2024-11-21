import { db } from "@/server/db";
import { type Plan, plans } from "@/server/db/schema";
import { unstable_cache } from "next/cache";
import PricingCard from "./PricingCard";

const getPlans: () => Promise<Plan[]> = unstable_cache(
  async () => {
    const plansFromDb = await db.select().from(plans);
    return [
      {
        id: "free-plan",
        name: "Free Plan",
        features: ["1 automated workflow", "Up to 3 service Integrations"],
      },
      ...plansFromDb,
    ];
  },
  ["plans"],
  { revalidate: 3600 * 24 * 7, tags: ["plans"] },
);

export default async function Plans() {
  const plans = await getPlans();
  return plans.map((plan) => {
    return <PricingCard plan={plan} key={plan.id} />;
  });
}
