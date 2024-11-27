import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";

export function toastUpgradePlan(messagePlan: string) {
  toast("Upgrade your plan", {
    description: messagePlan,
    action: (
      <Link
        href="/billing"
        className={buttonVariants({ className: "ml-auto" })}
      >
        Go
      </Link>
    ),
    position: "bottom-right",
  });
}
