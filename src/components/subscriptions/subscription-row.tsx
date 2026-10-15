"use client";

import { MoneyText } from "@/components/ui/money-text";
import { CountdownChip } from "@/components/ui/countdown-chip";
import { ServiceAvatar } from "@/components/ui/service-avatar";
import { UrgencyRail } from "@/components/ui/urgency-rail";
import { TrendUpIcon } from "@/components/ui/icons";
import { computeCancelWindow } from "@/lib/domain/cancel-by";
import { formatMoney } from "@/lib/domain/currency";
import { formatDate } from "@/lib/domain/format";
import { priceChange } from "@/lib/domain/price-history";
import type { Subscription } from "@/lib/domain/schema";
import { getUrgencyPresentation } from "@/lib/domain/urgency";

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
  const tone = cancelled ? "muted" : getUrgencyPresentation(window.urgency).tone;
  const change = priceChange(subscription.priceHistory);
  const increased = !cancelled && change?.increased === true;

  return (
    <button
      type="button"
      onClick={() => onSelect(subscription)}
      className="flex w-full items-stretch gap-3 rounded-card border border-line bg-surface p-3 text-left shadow-card transition-colors active:bg-bone"
    >
      <UrgencyRail tone={tone} />
      <ServiceAvatar
        category={subscription.category}
        className={cancelled ? "opacity-50" : undefined}
      />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium text-ink">{subscription.name}</span>
          {subscription.isTrial ? (
            <span className="shrink-0 rounded-full bg-ember-soft px-2 py-0.5 text-[11px] font-medium text-ember-strong">
              Trial
            </span>
          ) : null}
          {increased && change ? (
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-urgent-soft px-2 py-0.5 text-[11px] font-medium text-urgent">
              <TrendUpIcon width={11} height={11} />
              {formatMoney(change.delta, subscription.currency)}
            </span>
          ) : null}
        </div>
        <span className="truncate text-xs text-muted">
          Next charge {formatDate(subscription.nextRenewal)}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-center gap-1.5">
        {cancelled ? (
          <span className="inline-flex items-center rounded-full bg-line/50 px-2.5 py-1 text-xs font-medium text-muted">
            Cancelled
          </span>
        ) : (
          <CountdownChip window={window} />
        )}
        <MoneyText
          amount={subscription.amount}
          currency={subscription.currency}
          className="text-xs text-muted"
        />
      </div>
    </button>
  );
}
