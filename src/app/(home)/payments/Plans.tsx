import { getPlans } from "@/server/db/data";
import { revalidateTag } from "next/cache";
import PricingCard from "./PricingCard";

export default async function Plans() {
  const plans = await getPlans();
  revalidateTag("plans");
  return plans.map((plan) => {
    return <PricingCard plan={plan} key={plan.id} />;
  });
}
