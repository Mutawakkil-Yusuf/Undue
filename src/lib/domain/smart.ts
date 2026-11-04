import { advance, advanceToFuture } from "./cycle";
import { addDays, civilDate, parseIsoDate } from "./date";
import { priceChange, type PriceChange } from "./price-history";
import type { Subscription } from "./schema";
import { convert, type FxToNgn } from "./currency";
import { monthlyAmount, annualAmount } from "./spend";
import { getBillingDay, getEffectiveAmount } from "./subscription";
import type { CategoryId, CurrencyCode } from "./schema";

export interface OverlapGroup {
  readonly category: CategoryId;
  readonly count: number;
  readonly monthly: number;
  readonly annual: number;
  readonly items: readonly {
    readonly id: string;
    readonly name: string;
    readonly monthly: number;
  }[];
}

export interface UpcomingCharge {
  readonly subscriptionId: string;
  readonly name: string;
  /** Amount in display currency. */
  readonly amount: number;
  /** Original charged amount, useful for plan-specific detail. */
  readonly originalAmount: number;
  readonly originalCurrency: CurrencyCode;
  readonly date: string;
}

export interface UpcomingCashNeed {
  readonly amount: number;
  readonly currency: CurrencyCode;
  readonly charges: readonly UpcomingCharge[];
  readonly largest: UpcomingCharge | null;
}

export interface PriceMove {
  readonly subscription: Subscription;
  readonly change: PriceChange;
}

export interface PaymentRisk {
  readonly subscription: Subscription;
  readonly daysUntilCharge: number;
}

export interface StaleUnsurePlan {
  readonly subscription: Subscription;
  readonly monthly: number;
  readonly annual: number;
}

function isActive(subscription: Subscription): boolean {
  return subscription.status === "active";
}

function displayMonthly(
  subscription: Subscription,
  displayCurrency: CurrencyCode,
  fxToNgn: FxToNgn,
): number {
  return monthlyAmount(
    convert(
      getEffectiveAmount(subscription),
      subscription.currency,
      displayCurrency,
      fxToNgn,
    ),
    subscription.cycle,
  );
}

export function findOverlappingGroups(
  subscriptions: readonly Subscription[],
  displayCurrency: CurrencyCode,
  fxToNgn: FxToNgn,
): OverlapGroup[] {
  const groups = new Map<
    CategoryId,
    { items: { id: string; name: string; monthly: number }[]; monthly: number }
  >();

  for (const subscription of subscriptions) {
    if (!isActive(subscription)) {
      continue;
    }
    const monthly = displayMonthly(subscription, displayCurrency, fxToNgn);
    const group = groups.get(subscription.category) ?? { items: [], monthly: 0 };
    group.items.push({ id: subscription.id, name: subscription.name, monthly });
    group.monthly += monthly;
    groups.set(subscription.category, group);
  }

  return [...groups.entries()]
    .filter(([, group]) => group.items.length >= 2)
    .map(([category, group]) => ({
      category,
      count: group.items.length,
      monthly: group.monthly,
      annual: group.monthly * 12,
      items: [...group.items].sort((a, b) => b.monthly - a.monthly),
    }))
    .sort((a, b) => b.monthly - a.monthly);
}

/**
 * Sum every charge due in the next `days` days, including multiple cycles of
 * short-cycle plans. Annual plans contribute only when due inside the window.
 */
export function upcomingCashNeed(
  subscriptions: readonly Subscription[],
  options: {
    readonly now: Date;
    readonly days: number;
    readonly displayCurrency: CurrencyCode;
    readonly fxToNgn: FxToNgn;
  },
): UpcomingCashNeed {
  const { now, days, displayCurrency, fxToNgn } = options;
  const start = civilDate(now);
  const horizon = addDays(start, days);
  const charges: UpcomingCharge[] = [];

  for (const subscription of subscriptions) {
    if (!isActive(subscription)) {
      continue;
    }
    const billingDay =
      subscription.cycle.unit === "month" || subscription.cycle.unit === "year"
        ? getBillingDay(subscription)
        : undefined;

    let occurrence = advanceToFuture(
      parseIsoDate(subscription.nextRenewal),
      subscription.cycle,
      start,
      billingDay,
    );
    let guard = 0;
    while (
      occurrence.getTime() < horizon.getTime() &&
      charges.length < 10_000 &&
      guard < 64
    ) {
      const originalAmount = getEffectiveAmount(subscription);
      const amount = convert(
        originalAmount,
        subscription.currency,
        displayCurrency,
        fxToNgn,
      );
      charges.push({
        subscriptionId: subscription.id,
        name: subscription.name,
        amount,
        originalAmount,
        originalCurrency: subscription.currency,
        date: occurrence.toISOString().slice(0, 10),
      });
      occurrence = advance(occurrence, subscription.cycle, billingDay);
      guard += 1;
    }
  }

  charges.sort((a, b) => a.date.localeCompare(b.date));
  const amount = charges.reduce((sum, charge) => sum + charge.amount, 0);
  const largest =
    charges.length > 0
      ? charges.reduce((max, charge) => (charge.amount > max.amount ? charge : max))
      : null;

  return { amount, currency: displayCurrency, charges, largest };
}

export function detectPriceMoves(subscriptions: readonly Subscription[]): PriceMove[] {
  const moves: PriceMove[] = [];
  for (const subscription of subscriptions) {
    if (!isActive(subscription)) {
      continue;
    }
    const change = priceChange(subscription.priceHistory);
    if (change?.increased) {
      moves.push({ subscription, change });
    }
  }
  return moves.sort((a, b) => {
    const pctA = a.change.pct ?? 0;
    const pctB = b.change.pct ?? 0;
    return pctB - pctA || b.change.delta - a.change.delta;
  });
}

export function detectPaymentRisks(
  subscriptions: readonly Subscription[],
  now: Date = new Date(),
): PaymentRisk[] {
  const start = civilDate(now);
  const risks: PaymentRisk[] = [];

  for (const subscription of subscriptions) {
    if (!isActive(subscription)) {
      continue;
    }
    if (
      subscription.chargeStatus !== "failed" &&
      subscription.chargeStatus !== "declined"
    ) {
      continue;
    }
    const billingDay =
      subscription.cycle.unit === "month" || subscription.cycle.unit === "year"
        ? getBillingDay(subscription)
        : undefined;
    const next = advanceToFuture(
      parseIsoDate(subscription.nextRenewal),
      subscription.cycle,
      start,
      billingDay,
    );
    risks.push({
      subscription,
      daysUntilCharge: Math.round((next.getTime() - start.getTime()) / 86_400_000),
    });
  }

  return risks.sort((a, b) => a.daysUntilCharge - b.daysUntilCharge);
}

export function findStaleUnsurePlans(
  subscriptions: readonly Subscription[],
  options: {
    readonly now: Date;
    readonly olderThanDays: number;
    readonly displayCurrency: CurrencyCode;
    readonly fxToNgn: FxToNgn;
  },
): StaleUnsurePlan[] {
  const { now, olderThanDays, displayCurrency, fxToNgn } = options;
  const threshold = now.getTime() - olderThanDays * 86_400_000;

  return subscriptions
    .filter((subscription) => {
      if (
        !isActive(subscription) ||
        subscription.decision !== "unsure" ||
        !subscription.decisionUpdatedAt
      ) {
        return false;
      }
      const updated = new Date(subscription.decisionUpdatedAt).getTime();
      return Number.isFinite(updated) && updated < threshold;
    })
    .map((subscription) => {
      const monthly = displayMonthly(subscription, displayCurrency, fxToNgn);
      return {
        subscription,
        monthly,
        annual: annualAmount(monthly, { unit: "month", interval: 1 }),
      };
    })
    .sort((a, b) => b.annual - a.annual);
}
