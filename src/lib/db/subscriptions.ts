import { db } from "./client";
import {
  subscriptionSchema,
  type Cycle,
  type CategoryId,
  type CurrencyCode,
  type Subscription,
  type SubscriptionStatus,
} from "@/lib/domain/schema";
import { nowIso } from "@/lib/utils/time";

export interface SubscriptionInput {
  name: string;
  serviceId: string | null;
  emoji: string;
  category: CategoryId;
  amount: number;
  currency: CurrencyCode;
  cycle: Cycle;
  nextRenewal: string;
  leadDays: number;
  isTrial: boolean;
  cancelUrl: string | null;
  notes: string | null;
}

function buildSubscription(input: SubscriptionInput): Subscription {
  const timestamp = nowIso();
  return subscriptionSchema.parse({
    ...input,
    id: crypto.randomUUID(),
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
    id,
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

export async function deleteSubscription(id: string): Promise<void> {
  await db.subscriptions.delete(id);
}
