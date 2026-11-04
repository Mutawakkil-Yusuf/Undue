"use client";

import { useAppData } from "@/components/providers/app-data-provider";
import { useToast } from "@/components/providers/toast-provider";
import { MoneyText } from "@/components/ui/money-text";
import { setSubscriptionDecision } from "@/lib/db/subscriptions";
import { costOf } from "@/lib/domain/decisions";
import {
  DECISIONS,
  DECISION_LABELS,
  type Subscription,
  type Decision,
} from "@/lib/domain/schema";
import { cn } from "@/lib/utils/cn";
import { mascotReact } from "@/lib/utils/mascot-events";

export const DECISION_SELECTED_CLASS: Record<Decision, string> = {
  keep: "bg-lime text-ink-fixed",
  unsure: "bg-yellow text-ink-fixed",
  cut: "bg-coral text-ink-fixed",
};

export function KeepOrCut({ subscription }: { subscription: Subscription }) {
  const { settings } = useAppData();
  const { showToast } = useToast();
  const { monthly, annual } = costOf(
    subscription,
    settings.displayCurrency,
    settings.fxToNgn,
  );
  const isCut = subscription.decision === "cut";

  async function choose(next: Decision) {
    try {
      // Tapping the selected option again clears it.
      const clearing = subscription.decision === next;
      await setSubscriptionDecision(subscription.id, clearing ? null : next);
      if (!clearing && next !== "unsure") {
        mascotReact(next === "keep" ? "hop" : "nod");
      }
    } catch {
      showToast("Could not save that", "danger");
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-[1.5rem] bg-surface p-4 shadow-card">
      <div className="flex flex-col gap-0.5">
        <span className="text-coral-ink text-[11px] font-bold tracking-[0.13em] uppercase">
          Is it worth it?
        </span>
        <span className="font-display text-xl leading-tight font-extrabold tracking-[-0.04em] text-ink">
          {isCut ? "Cutting this saves" : "Cancelling saves"}{" "}
          <MoneyText
            key={isCut ? "cut" : "idle"}
            amount={annual}
            currency={settings.displayCurrency}
            rounded
            animate={isCut}
            countFromZero={isCut}
          />{" "}
          a year
        </span>
        <span className="text-[11px] text-muted">
          That is{" "}
          <MoneyText amount={monthly} currency={settings.displayCurrency} rounded /> a
          month.
        </span>
      </div>
      <div className="flex gap-2" role="group" aria-label="Keep, unsure or cut">
        {DECISIONS.map((verdict) => {
          const selected = subscription.decision === verdict;
          return (
            <button
              key={verdict}
              type="button"
              aria-pressed={selected}
              onClick={() => void choose(verdict)}
              className={cn(
                "flex-1 rounded-full px-3.5 py-2 text-xs font-bold transition-colors",
                selected
                  ? DECISION_SELECTED_CLASS[verdict]
                  : "bg-surface-soft text-muted hover:text-ink",
              )}
            >
              {DECISION_LABELS[verdict]}
            </button>
          );
        })}
      </div>
    </section>
  );
}
