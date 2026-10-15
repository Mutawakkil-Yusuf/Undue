"use client";

import { computeCancelWindow } from "@/lib/domain/cancel-by";
import type { Subscription } from "@/lib/domain/schema";
import { compareUrgency } from "@/lib/domain/urgency";
import { SubscriptionRow } from "./subscription-row";

interface SubscriptionListProps {
  subscriptions: readonly Subscription[];
  referenceDate: Date;
  onSelect: (subscription: Subscription) => void;
}

export function sortByUrgency(
  subscriptions: readonly Subscription[],
  referenceDate: Date,
): Subscription[] {
  return [...subscriptions].sort((a, b) => {
    const windowA = computeCancelWindow(a, referenceDate);
    const windowB = computeCancelWindow(b, referenceDate);

    const byUrgency = compareUrgency(windowA.urgency, windowB.urgency);
    if (byUrgency !== 0) {
      return byUrgency;
    }
    return windowA.daysUntilCancelBy - windowB.daysUntilCancelBy;
  });
}

export function SubscriptionList({
  subscriptions,
  referenceDate,
  onSelect,
}: SubscriptionListProps) {
  const sorted = sortByUrgency(subscriptions, referenceDate);

  return (
    <ul className="flex flex-col gap-2.5">
      {sorted.map((subscription) => (
        <li key={subscription.id}>
          <SubscriptionRow
            subscription={subscription}
            referenceDate={referenceDate}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  );
}
