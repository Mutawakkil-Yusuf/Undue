import type { Cycle } from "./schema";
import { addDays, civilDate, diffInDays, formatIsoDate, parseIsoDate } from "./date";
import { advanceToFuture } from "./cycle";
import { getBillingDay, getTrialEnd } from "./subscription";
import type { UrgencyLevel } from "./urgency";

export interface CancelWindow {
  readonly cancelBy: string;
  /** The effective renewal/trial-conversion date after rolling old dates forward. */
  readonly renewal: string;
  readonly daysUntilRenewal: number;
  readonly daysUntilCancelBy: number;
  readonly urgency: UrgencyLevel;
}

type CancelWindowInput = {
  nextRenewal: string;
  leadDays: number;
  billingDay?: number | undefined;
  isTrial?: boolean | undefined;
  trialEndsAt?: string | null | undefined;
  cycle?: Cycle | undefined;
};

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
  subscription: CancelWindowInput,
  clock: Date = new Date(),
): CancelWindow {
  const reference = civilDate(clock);
  const trialEnd = getTrialEnd(subscription);
  const storedRenewal = parseIsoDate(trialEnd ?? subscription.nextRenewal);

  // A trial's conversion date is its deadline. Once it has passed we keep it
  // visible so the user can confirm conversion or cancel, rather than silently
  // rolling into a paid plan.
  const renewal =
    trialEnd || !subscription.cycle
      ? storedRenewal
      : advanceToFuture(
          storedRenewal,
          subscription.cycle as Cycle,
          reference,
          getBillingDay(subscription),
        );

  const cancelByDate = addDays(renewal, -subscription.leadDays);
  const daysUntilRenewal = diffInDays(reference, renewal);
  const daysUntilCancelBy = diffInDays(reference, cancelByDate);

  return {
    cancelBy: formatIsoDate(cancelByDate),
    renewal: formatIsoDate(renewal),
    daysUntilRenewal,
    daysUntilCancelBy,
    // A trial that has passed its end date needs action now: confirm the paid
    // conversion or cancel. Keep it in the urgent bucket instead of letting it
    // disappear into "Later" with ordinary past renewals.
    urgency:
      trialEnd && daysUntilRenewal < 0
        ? "missed"
        : resolveUrgency(daysUntilRenewal, daysUntilCancelBy),
  };
}
