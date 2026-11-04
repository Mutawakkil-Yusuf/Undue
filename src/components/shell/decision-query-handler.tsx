"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/providers/toast-provider";
import { db } from "@/lib/db/client";
import { setSubscriptionDecision } from "@/lib/db/subscriptions";

/** Handle Keep/Cut deep links from notification actions. */
export function DecisionQueryHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  useEffect(() => {
    const decision = searchParams.get("decision");
    const id = searchParams.get("id");
    if ((decision !== "keep" && decision !== "cut") || !id) {
      return;
    }

    let active = true;
    void (async () => {
      try {
        const subscription = await db.subscriptions.get(id);
        if (!subscription) {
          showToast("Couldn't find that plan", "danger");
          return;
        }
        await setSubscriptionDecision(subscription.id, decision);
        if (active) {
          showToast(
            `${subscription.name} marked as ${decision === "keep" ? "Keep" : "Cut"}`,
            "success",
          );
        }
      } catch {
        if (active) {
          showToast("Couldn't save that decision", "danger");
        }
      } finally {
        if (active) {
          router.replace("/app", { scroll: false });
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [searchParams, router, showToast]);

  return null;
}
