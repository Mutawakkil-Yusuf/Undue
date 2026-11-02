"use client";

import { MoneyText } from "@/components/ui/money-text";
import { ServiceAvatar } from "@/components/ui/service-avatar";
import { TrendUpIcon } from "@/components/ui/icons";
import { computeCancelWindow } from "@/lib/domain/cancel-by";
import { formatMoney } from "@/lib/domain/currency";
import { formatDate } from "@/lib/domain/format";
import { priceChange } from "@/lib/domain/price-history";
import type { Subscription } from "@/lib/domain/schema";
import { getUrgencyPresentation, urgencySurfaceClass } from "@/lib/domain/urgency";
import { cn } from "@/lib/utils/cn";

interface SubscriptionRowProps {
  subscription: Subscription;
  referenceDate: Date;
  onSelect: (subscription: Subscription) => void;
}

export function SubscriptionRow({
  subscription,
  referenceDate,
  onSelect,
}: SubscriptionRowProps) {
  const window = computeCancelWindow(subscription, referenceDate);
  const cancelled = subscription.status === "cancelled";
  const presentation = getUrgencyPresentation(window.urgency);
  const change = priceChange(subscription.priceHistory);
  const increased = !cancelled && change?.increased === true;

  return (
    <button
      type="button"
      onClick={() => onSelect(subscription)}
      className="flex w-full items-center gap-3 rounded-[1.4rem] bg-surface p-3.5 text-left shadow-card transition-transform duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.99]"
    >
      <ServiceAvatar
        category={subscription.category}
        size="md"
        className={cancelled ? "opacity-50 grayscale" : undefined}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-sm font-bold text-ink">{subscription.name}</span>
          {subscription.isTrial ? (
            <span className="shrink-0 rounded-full bg-coral px-1.5 py-0.5 text-[10px] font-bold text-ink-fixed">
              Trial
            </span>
          ) : null}
          {increased && change ? (
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-urgent-soft px-1.5 py-0.5 text-[10px] font-bold text-urgent">
              <TrendUpIcon width={10} height={10} />
              {formatMoney(change.delta, subscription.currency)}
            </span>
          ) : null}
        </div>
        <span className="truncate text-xs text-muted">
          {cancelled
            ? "Cancelled"
            : `Next charge ${formatDate(subscription.nextRenewal)}`}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {cancelled ? (
          <span className="rounded-full bg-line/60 px-2.5 py-1 text-[11px] font-bold text-muted">
            Cancelled
          </span>
        ) : (
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-bold",
              urgencySurfaceClass(presentation.tone),
            )}
          >
            {presentation.level === "today"
              ? "Today"
              : presentation.level === "missed" || presentation.level === "past"
                ? "Passed"
                : `${Math.max(0, window.daysUntilCancelBy)}d`}
          </span>
        )}
        <MoneyText
          amount={subscription.amount}
          currency={subscription.currency}
          className="text-xs font-semibold text-muted"
        />
      </div>
    </button>
  );
}
