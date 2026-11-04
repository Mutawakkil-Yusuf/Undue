import { db } from "./client";
import {
  subscriptionSchema,
  type CategoryId,
  type ChargeStatus,
  type CurrencyCode,
  type Cycle,
  type Decision,
  type PaidVia,
  type Subscription,
  type SubscriptionStatus,
} from "@/lib/domain/schema";
import { parseIsoDate, todayIso } from "@/lib/domain/date";
import { recordPrice } from "@/lib/domain/price-history";
import { nowIso } from "@/lib/utils/time";

export interface SubscriptionInput {
  name: string;
  serviceId: string | null;
  category: CategoryId;
  amount: number;
  currency: CurrencyCode;
  cycle: Cycle;
  nextRenewal: string;
  billingDay?: number;
  leadDays: number;
  isTrial: boolean;
  trialEndsAt?: string | null;
  paidVia?: PaidVia;
  chargeStatus?: ChargeStatus;
  decision?: Decision | null;
  decisionUpdatedAt?: string | null;
  myShare?: number | null;
  cancelUrl: string | null;
  notes: string | null;
}

function billingDayFor(
  input: Pick<SubscriptionInput, "nextRenewal" | "billingDay">,
): number {
  if (input.billingDay !== undefined) {
    return Math.min(31, Math.max(1, Math.trunc(input.billingDay)));
  }
  try {
    return parseIsoDate(input.nextRenewal).getUTCDate();
  } catch {
    return 1;
  }
}

function buildSubscription(input: SubscriptionInput): Subscription {
  const timestamp = nowIso();
  return subscriptionSchema.parse({
    ...input,
    billingDay: billingDayFor(input),
    trialEndsAt: input.isTrial ? (input.trialEndsAt ?? input.nextRenewal) : null,
    paidVia: input.paidVia ?? "card",
    chargeStatus: input.chargeStatus ?? "unknown",
    decision: input.decision ?? null,
    decisionUpdatedAt:
      input.decision !== undefined ? (input.decisionUpdatedAt ?? nowIso()) : null,
    myShare: input.myShare ?? null,
    id: crypto.randomUUID(),
    priceHistory: recordPrice([], {
      at: todayIso(),
      amount: input.amount,
      currency: input.currency,
    }),
    status: "active" satisfies SubscriptionStatus,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export async function createSubscription(
  input: SubscriptionInput,
): Promise<Subscription> {
  const subscription = buildSubscription(input);
  await db.subscriptions.put(subscription);
  return subscription;
}

export async function createSubscriptions(
  inputs: readonly SubscriptionInput[],
): Promise<Subscription[]> {
  const subscriptions = inputs.map(buildSubscription);
  await db.transaction("rw", db.subscriptions, async () => {
    await db.subscriptions.bulkPut(subscriptions);
  });
  return subscriptions;
}

export async function updateSubscription(
  id: string,
  input: SubscriptionInput,
): Promise<void> {
  const existing = await db.subscriptions.get(id);
  if (!existing) {
    throw new Error(`Subscription not found: ${id}`);
  }
  const next = subscriptionSchema.parse({
    ...existing,
    ...input,
    billingDay: billingDayFor(input),
    trialEndsAt: input.isTrial ? (input.trialEndsAt ?? input.nextRenewal) : null,
    paidVia: input.paidVia ?? existing.paidVia ?? "card",
    chargeStatus: input.chargeStatus ?? existing.chargeStatus ?? "unknown",
    decision: input.decision ?? existing.decision ?? null,
    decisionUpdatedAt:
      input.decision !== undefined
        ? (input.decisionUpdatedAt ?? nowIso())
        : (existing.decisionUpdatedAt ?? null),
    myShare: input.myShare ?? null,
    id,
    priceHistory: recordPrice(existing.priceHistory ?? [], {
      at: todayIso(),
      amount: input.amount,
      currency: input.currency,
    }),
    updatedAt: nowIso(),
  });
  await db.subscriptions.put(next);
}

export async function setSubscriptionStatus(
  id: string,
  status: SubscriptionStatus,
): Promise<void> {
  await db.subscriptions.update(id, { status, updatedAt: nowIso() });
}

export async function advanceRenewal(id: string, nextRenewal: string): Promise<void> {
  await db.subscriptions.update(id, { nextRenewal, updatedAt: nowIso() });
}

export async function convertTrial(id: string, nextRenewal: string): Promise<void> {
  await db.subscriptions.update(id, {
    isTrial: false,
    trialEndsAt: null,
    nextRenewal,
    updatedAt: nowIso(),
  });
}

export async function setSubscriptionLeadDays(
  id: string,
  leadDays: number,
): Promise<void> {
  await db.subscriptions.update(id, {
    leadDays: Math.min(60, Math.max(0, Math.trunc(leadDays))),
    updatedAt: nowIso(),
  });
}

export async function deleteSubscription(id: string): Promise<void> {
  await db.subscriptions.delete(id);
}

export async function restoreSubscription(subscription: Subscription): Promise<void> {
  await db.subscriptions.put(subscription);
}

export async function setSubscriptionDecision(
  id: string,
  decision: Decision | null,
): Promise<void> {
  await db.subscriptions.update(id, {
    decision,
    decisionUpdatedAt: nowIso(),
    updatedAt: nowIso(),
  });
}
