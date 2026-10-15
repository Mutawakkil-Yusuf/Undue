import type { Cycle, CurrencyCode, Subscription } from "./schema";
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
