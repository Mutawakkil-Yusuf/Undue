import type { Subscription } from "./schema";
import { addDays, civilDate, diffInDays, formatIsoDate, parseIsoDate } from "./date";
import type { UrgencyLevel } from "./urgency";

export interface CancelWindow {
  readonly cancelBy: string;
  readonly daysUntilRenewal: number;
  readonly daysUntilCancelBy: number;
  readonly urgency: UrgencyLevel;
}

function resolveUrgency(
  daysUntilRenewal: number,
  daysUntilCancelBy: number,
): UrgencyLevel {
  if (daysUntilRenewal < 0) {
    return "past";
  }
  if (daysUntilCancelBy < 0) {
    return "missed";
  }
  if (daysUntilCancelBy === 0) {
    return "today";
  }
  if (daysUntilCancelBy <= 2) {
    return "urgent";
  }
  if (daysUntilCancelBy <= 7) {
    return "soon";
  }
  return "safe";
}

export function computeCancelWindow(
  subscription: Pick<Subscription, "nextRenewal" | "leadDays">,
  clock: Date = new Date(),
): CancelWindow {
  const reference = civilDate(clock);
  const renewal = parseIsoDate(subscription.nextRenewal);
  const cancelByDate = addDays(renewal, -subscription.leadDays);

  const daysUntilRenewal = diffInDays(reference, renewal);
  const daysUntilCancelBy = diffInDays(reference, cancelByDate);

  return {
    cancelBy: formatIsoDate(cancelByDate),
    daysUntilRenewal,
    daysUntilCancelBy,
    urgency: resolveUrgency(daysUntilRenewal, daysUntilCancelBy),
  };
}
