import { parseIsoDate } from "./date";
import type { ChargeStatus, PaidVia, Subscription, SubscriptionStatus } from "./schema";

export function getBillingDay(
  subscription: Pick<Subscription, "nextRenewal" | "billingDay">,
): number {
  if (subscription.billingDay !== undefined) {
    return subscription.billingDay;
  }
  try {
    return parseIsoDate(subscription.nextRenewal).getUTCDate();
  } catch {
    return 1;
  }
}

export function getEffectiveAmount(
  subscription: Pick<Subscription, "amount" | "myShare" | "shareCount">,
): number {
  // An explicit absolute share wins over the split ratio when both are set.
  if (subscription.myShare != null) {
    return subscription.myShare;
  }
  const people = subscription.shareCount ?? 1;
  return people > 1 ? subscription.amount / people : subscription.amount;
}

export function getTrialEnd(subscription: {
  isTrial?: boolean | undefined;
  trialEndsAt?: string | null | undefined;
  nextRenewal: string;
}): string | null {
  if (!subscription.isTrial) {
    return null;
  }
  return subscription.trialEndsAt ?? subscription.nextRenewal;
}

export function getPaidVia(subscription: Pick<Subscription, "paidVia">): PaidVia {
  return subscription.paidVia ?? "card";
}

export function getChargeStatus(
  subscription: Pick<Subscription, "chargeStatus">,
): ChargeStatus {
  return subscription.chargeStatus ?? "unknown";
}

export function isActiveSubscription(
  subscription: Pick<Subscription, "status">,
): boolean {
  return subscription.status === ("active" satisfies SubscriptionStatus);
}

export function hasPaymentProblem(
  subscription: Pick<Subscription, "chargeStatus">,
): boolean {
  const status = getChargeStatus(subscription);
  return status === "failed" || status === "declined";
}
