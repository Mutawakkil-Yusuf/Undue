"use client";

import { MoneyText } from "@/components/ui/money-text";
import { ServiceAvatar } from "@/components/ui/service-avatar";
import type { CostRow, CutSummary } from "@/lib/domain/decisions";
import type { CurrencyCode, Subscription } from "@/lib/domain/schema";
import { useFlip } from "@/lib/hooks/use-flip";
import { useInView } from "@/lib/hooks/use-in-view";
import { cn } from "@/lib/utils/cn";
import { DECISION_SELECTED_CLASS } from "./keep-or-cut";

const MAX_ROWS = 5;

interface BiggestCostsProps {
  rows: readonly CostRow[];
  cuts: CutSummary;
  currency: CurrencyCode;
  period: "monthly" | "annual";
  onSelect: (subscription: Subscription) => void;
}

export function BiggestCosts(props: BiggestCostsProps) {
  if (props.rows.length === 0) {
    return null;
  }
  return <BiggestCostsCard {...props} />;
}

/** A share bar that grows from the left the first time it scrolls into view. */
function ShareBar({
  share,
  shown,
  delayMs,
}: {
  share: number;
  shown: boolean;
  delayMs: number;
}) {
  return (
    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-soft">
      <span
        className="block h-full origin-left rounded-full bg-ink transition-transform duration-[400ms] ease-out motion-reduce:transition-none"
        style={{
          width: `${Math.max(share * 100, 3)}%`,
          transform: shown ? "scaleX(1)" : "scaleX(0)",
          transitionDelay: shown ? `${delayMs}ms` : "0ms",
        }}
      />
    </span>
  );
}

function BiggestCostsCard({ rows, cuts, currency, period, onSelect }: BiggestCostsProps) {
  const [sectionRef, shown] = useInView<HTMLElement>();
  const listRef = useFlip<HTMLUListElement>();

  return (
    <section
      ref={sectionRef}
      className="flex flex-col gap-4 rounded-[2rem] bg-surface p-5 shadow-card sm:p-6"
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-coral-ink text-[11px] font-bold tracking-[0.13em] uppercase">
          Biggest costs
        </span>
        <span className="text-xs text-muted">
          Tap a plan to decide: keep, unsure or cut.
        </span>
      </div>

      <ul ref={listRef} className="flex flex-col gap-3.5">
        {rows.slice(0, MAX_ROWS).map((row, index) => {
          const { subscription } = row;
          const verdict = subscription.decision;
          return (
            <li key={subscription.id} data-flip-key={subscription.id}>
              <button
                type="button"
                onClick={() => onSelect(subscription)}
                className="flex w-full items-center gap-3 text-left"
              >
                <ServiceAvatar category={subscription.category} size="sm" />
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-bold text-ink">
                        {subscription.name}
                      </span>
                      {verdict ? (
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase",
                            DECISION_SELECTED_CLASS[verdict],
                          )}
                        >
                          {verdict}
                        </span>
                      ) : null}
                    </span>
                    <MoneyText
                      amount={period === "monthly" ? row.monthly : row.annual}
                      currency={currency}
                      rounded
                      className="shrink-0 text-sm font-bold text-ink"
                    />
                  </span>
                  <span className="flex items-center gap-2">
                    <ShareBar share={row.share} shown={shown} delayMs={index * 60} />
                    <span className="w-9 text-right text-[11px] font-semibold text-muted">
                      {Math.round(row.share * 100)}%
                    </span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="rounded-2xl bg-surface-soft px-4 py-3 text-xs leading-relaxed font-semibold text-ink">
        {cuts.count > 0 ? (
          <>
            Cutting your {cuts.count} {cuts.count === 1 ? "plan" : "plans"} saves{" "}
            <MoneyText
              amount={cuts.annual}
              currency={currency}
              rounded
              animate
              countFromZero
            />{" "}
            a year.
          </>
        ) : rows.length > 1 ? (
          "Tag a plan Cut to see what you would save."
        ) : (
          "Add more plans to compare what each one costs you."
        )}
      </p>
    </section>
  );
}
