import { type Plan } from "./db/schema";

export function getLimitMontlyExecutions(plan: Plan | null | undefined) {
  if (!plan) return 100;
  if (plan.name === "Enterprise Plan") return null;
  return 1000;
}

export function getLimitAutomatedWorkflows(plan: Plan | null | undefined) {
  if (!plan) return 1;
  if (plan.name === "Enterprise Plan") return null;
  return 10;
}

export function getLimitServiceIntegrations(plan: Plan | null | undefined) {
  if (!plan) return 3;
  if (plan.name === "Enterprise Plan") return null;
  return 15;
}
