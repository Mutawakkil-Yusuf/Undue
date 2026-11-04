"use client";

import { useMemo, type ReactNode } from "react";
import { useToast } from "@/components/providers/toast-provider";
import { MoneyText } from "@/components/ui/money-text";
import { ServiceAvatar } from "@/components/ui/service-avatar";
import { setSubscriptionDecision } from "@/lib/db/subscriptions";
import type { FxToNgn } from "@/lib/domain/currency";
import { formatCountdown, formatDate } from "@/lib/domain/format";
import {
  getCategory,
  type CurrencyCode,
  type Subscription,
  type Decision,
} from "@/lib/domain/schema";
import {
  findOverlaps,
  pickDecision,
  recentPriceHikes,
  staleUnsure,
  upcomingCharges,
  UPCOMING_CHARGE_DAYS,
} from "@/lib/domain/smart";
import { cn } from "@/lib/utils/cn";
import { mascotReact } from "@/lib/utils/mascot-events";

interface DecisionCardProps {
  subscriptions: readonly Subscription[];
  today: Date;
  onOpen: (subscription: Subscription) => void;
}

/** Asks "still using this?" for the plan whose cancel window is closest. */
export function DecisionCard({ subscriptions, today, onOpen }: DecisionCardProps) {
  const { showToast } = useToast();
  const decision = useMemo(
    () => pickDecision(subscriptions, today),
    [subscriptions, today],
  );

  if (!decision) {
    return null;
  }

  const { subscription, window, markedCut } = decision;

  async function choose(decision: Decision) {
    try {
      await setSubscriptionDecision(subscription.id, decision);
      mascotReact(decision === "keep" ? "hop" : "nod");
    } catch {
      showToast("Could not save that", "danger");
    }
  }

  let timing: string;
  if (window.urgency === "missed") {
    timing = `The safe cancel window has passed. It renews on ${formatDate(subscription.nextRenewal)}.`;
  } else if (window.daysUntilCancelBy === 0) {
    timing = "Today is the last day to cancel.";
  } else {
    timing = `${formatCountdown(window.daysUntilCancelBy)} left to cancel. It renews on ${formatDate(subscription.nextRenewal)}.`;
  }

  return (
    <section className="flex flex-col gap-4 rounded-[1.75rem] bg-yellow p-5 text-ink-fixed shadow-card">
      <div className="flex items-center gap-3">
        <ServiceAvatar category={subscription.category} size="sm" />
        <div className="flex min-w-0 flex-col">
          <span className="text-[11px] font-bold tracking-[0.13em] uppercase opacity-70">
            {markedCut ? "You planned to cut this" : "Still using this?"}
          </span>
          <span className="truncate font-display text-xl leading-tight font-extrabold tracking-[-0.04em]">
            {subscription.name}
          </span>
        </div>
      </div>

      <p className="text-sm leading-relaxed font-semibold">
        {timing} It costs{" "}
        <MoneyText amount={subscription.amount} currency={subscription.currency} />.
      </p>

      <div className="flex flex-wrap gap-2">
        {markedCut ? (
          <button
            type="button"
            onClick={() => onOpen(subscription)}
            className="rounded-full bg-ink-fixed px-4 py-2 text-xs font-bold text-paper"
          >
            Open to cancel
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void choose("cut")}
            className="rounded-full bg-coral px-4 py-2 text-xs font-bold text-ink-fixed"
          >
            Cut it
          </button>
        )}
        <button
          type="button"
          onClick={() => void choose("keep")}
          className="rounded-full bg-lime px-4 py-2 text-xs font-bold text-ink-fixed"
        >
          Keep it
        </button>
        {markedCut ? null : (
          <button
            type="button"
            onClick={() => onOpen(subscription)}
            className="rounded-full bg-paper/40 px-4 py-2 text-xs font-bold text-ink-fixed"
          >
            Details
          </button>
        )}
      </div>
    </section>
  );
}

interface HeadsUpProps {
  subscriptions: readonly Subscription[];
  today: Date;
  currency: CurrencyCode;
  fxToNgn: FxToNgn;
  onSelect: (subscription: Subscription) => void;
}

interface HeadsUpRow {
  key: string;
  dot: string;
  title: ReactNode;
  detail: ReactNode;
  onClick?: () => void;
}

const MAX_ROWS = 4;

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/** Money due soon, price rises, overlapping plans and plans left undecided. */
export function HeadsUp({
  subscriptions,
  today,
  currency,
  fxToNgn,
  onSelect,
}: HeadsUpProps) {
  const rows = useMemo(() => {
    const list: HeadsUpRow[] = [];

    const charges = upcomingCharges(subscriptions, today, currency, fxToNgn);
    if (charges.items.length > 0) {
      const names = charges.items.slice(0, 3).map((item) => item.subscription.name);
      const extra = charges.items.length - names.length;
      list.push({
        key: "charges",
        dot: "bg-coral",
        title: (
          <>
            <MoneyText amount={charges.total} currency={currency} rounded /> leaves your
            account in the next {UPCOMING_CHARGE_DAYS} days
          </>
        ),
        detail: `${names.join(", ")}${extra > 0 ? ` and ${extra} more` : ""}. Make sure your card or wallet is funded.`,
      });
    }

    for (const hike of recentPriceHikes(subscriptions, today).slice(0, 2)) {
      const percent = hike.pct === null ? null : Math.round(hike.pct * 100);
      list.push({
        key: `hike-${hike.subscription.id}`,
        dot: "bg-yellow",
        title: `${hike.subscription.name} went up${percent === null ? "" : ` ${percent}%`}`,
        detail: (
          <>
            From <MoneyText amount={hike.from.amount} currency={hike.from.currency} /> to{" "}
            <MoneyText amount={hike.to.amount} currency={hike.to.currency} />. Still worth
            it?
          </>
        ),
        onClick: () => onSelect(hike.subscription),
      });
    }

    const review = staleUnsure(subscriptions, today, currency, fxToNgn);
    const firstUnsure = review.items[0];
    if (firstUnsure) {
      list.push({
        key: "unsure",
        dot: "bg-lime",
        title: `${plural(review.items.length, "plan")} still undecided`,
        detail: (
          <>
            Tagged unsure for a month and costing{" "}
            <MoneyText amount={review.annual} currency={currency} rounded /> a year. Tap
            to decide.
          </>
        ),
        onClick: () => onSelect(firstUnsure),
      });
    }

    for (const overlap of findOverlaps(subscriptions, currency, fxToNgn).slice(0, 2)) {
      const label = getCategory(overlap.category).label.toLowerCase();
      const first = subscriptions.find(
        (subscription) =>
          subscription.status === "active" && subscription.category === overlap.category,
      );
      list.push({
        key: `overlap-${overlap.category}`,
        dot: "bg-ink",
        title: `${overlap.count} ${label} plans`,
        detail: (
          <>
            {overlap.names.join(", ")} cost{" "}
            <MoneyText amount={overlap.monthly} currency={currency} rounded /> a month
            together. Do you need all of them?
          </>
        ),
        ...(first ? { onClick: () => onSelect(first) } : {}),
      });
    }

    return list.slice(0, MAX_ROWS);
  }, [subscriptions, today, currency, fxToNgn, onSelect]);

  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3 rounded-[2rem] bg-surface p-5 shadow-card sm:p-6">
      <span className="text-coral-ink text-[11px] font-bold tracking-[0.13em] uppercase">
        Heads up
      </span>
      <ul className="flex flex-col gap-3">
        {rows.map((row) => {
          const body = (
            <>
              <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", row.dot)} />
              <span className="flex min-w-0 flex-col gap-0.5 text-left">
                <span className="text-sm font-bold text-ink">{row.title}</span>
                <span className="text-xs leading-relaxed text-muted">{row.detail}</span>
              </span>
            </>
          );
          return (
            <li key={row.key}>
              {row.onClick ? (
                <button type="button" onClick={row.onClick} className="flex w-full gap-3">
                  {body}
                </button>
              ) : (
                <div className="flex gap-3">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
