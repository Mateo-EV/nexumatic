import { getPlans } from "@/server/db/data";
import PricingCard from "./PricingCard";

export default async function Plans() {
  const plans = await getPlans();
  return plans.map((plan) => {
    return <PricingCard plan={plan} key={plan.id} />;
  });
}
