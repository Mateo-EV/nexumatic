"use client";

import { cancelSubscription } from "@/app/(home)/payments/actions";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

export const CancelSubscriptionButton = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleCancelSubscription() {
    startTransition(async () => {
      const data = await cancelSubscription();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success(data.message);
      router.refresh();
    });
  }
  return (
    <Button variant="destructive" onClick={handleCancelSubscription}>
      {isPending ? (
        <LoadingSpinner className="mr-2" />
      ) : (
        <XIcon className="mr-2 size-4" />
      )}
      Cancel Subscription
    </Button>
  );
};
