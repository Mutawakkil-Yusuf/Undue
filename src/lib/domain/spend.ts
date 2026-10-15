import type { CategoryId, Cycle, CurrencyCode, Subscription } from "./schema";
import { monthsPerCycle } from "./cycle";
import { convert, type FxToNgn } from "./currency";

export function monthlyAmount(amount: number, cycle: Cycle): number {
  return amount / monthsPerCycle(cycle);
}

export function annualAmount(amount: number, cycle: Cycle): number {
  return monthlyAmount(amount, cycle) * 12;
}

export interface SpendSummary {
  readonly monthly: number;
  readonly annual: number;
}

function isActive(subscription: Subscription): boolean {
  return subscription.status === "active";
}

export function summarizeSpend(
  subscriptions: readonly Subscription[],
  displayCurrency: CurrencyCode,
  fxToNgn: FxToNgn,
): SpendSummary {
  let monthly = 0;

  for (const subscription of subscriptions) {
    if (!isActive(subscription)) {
      continue;
    }
    const inDisplayCurrency = convert(
      subscription.amount,
      subscription.currency,
      displayCurrency,
      fxToNgn,
    );
    monthly += monthlyAmount(inDisplayCurrency, subscription.cycle);
  }

  return { monthly, annual: monthly * 12 };
}

export function normalizeToDisplayCurrency(
  subscription: Subscription,
  displayCurrency: CurrencyCode,
  fxToNgn: FxToNgn,
): number {
  return convert(subscription.amount, subscription.currency, displayCurrency, fxToNgn);
}

export interface CategorySpend {
  readonly category: CategoryId;
  readonly monthly: number;
  readonly annual: number;
  readonly share: number;
}

export function summarizeByCategory(
  subscriptions: readonly Subscription[],
  displayCurrency: CurrencyCode,
  fxToNgn: FxToNgn,
): CategorySpend[] {
  const monthlyByCategory = new Map<CategoryId, number>();
  let total = 0;

  for (const subscription of subscriptions) {
    if (!isActive(subscription)) {
      continue;
    }
    const monthly = monthlyAmount(
      convert(subscription.amount, subscription.currency, displayCurrency, fxToNgn),
      subscription.cycle,
    );
    monthlyByCategory.set(
      subscription.category,
      (monthlyByCategory.get(subscription.category) ?? 0) + monthly,
    );
    total += monthly;
  }

  return [...monthlyByCategory.entries()]
    .map(([category, monthly]) => ({
      category,
      monthly,
      annual: monthly * 12,
      share: total > 0 ? monthly / total : 0,
    }))
    .sort((a, b) => b.monthly - a.monthly);
}

export interface SavingsSummary {
  readonly count: number;
  readonly monthly: number;
  readonly annual: number;
}

export function savingsFromCancelled(
  subscriptions: readonly Subscription[],
  displayCurrency: CurrencyCode,
  fxToNgn: FxToNgn,
): SavingsSummary {
  let monthly = 0;
  let count = 0;

  for (const subscription of subscriptions) {
    if (subscription.status !== "cancelled") {
      continue;
    }
    monthly += monthlyAmount(
      convert(subscription.amount, subscription.currency, displayCurrency, fxToNgn),
      subscription.cycle,
    );
    count += 1;
  }

  return { count, monthly, annual: monthly * 12 };
}
