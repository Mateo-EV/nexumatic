import { getPlans } from "@/server/db/data";
import PricingCard from "./PricingCard";
import { type Plan } from "@/server/db/schema";

export default async function Plans() {
  const plans = await getPlans();
  return plans.map((plan) => {
    return <PricingCard plan={plan as Plan} key={plan.id} />;
  });
}
