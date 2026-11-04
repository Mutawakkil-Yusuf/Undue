import type { CurrencyCode, Subscription } from "./schema";
import type { FxToNgn } from "./currency";
import { monthlyAmount, normalizeToDisplayCurrency } from "./spend";

export interface CostRow {
  readonly subscription: Subscription;
  readonly monthly: number;
  readonly annual: number;
  /** Fraction (0-1) of total active monthly spend. */
  readonly share: number;
}

export interface CutSummary {
  readonly count: number;
  readonly monthly: number;
  readonly annual: number;
}

/** What one plan costs the user per month and per year, in the display currency. */
export function costOf(
  subscription: Subscription,
  currency: CurrencyCode,
  fxToNgn: FxToNgn,
): { monthly: number; annual: number } {
  const monthly = monthlyAmount(
    normalizeToDisplayCurrency(subscription, currency, fxToNgn),
    subscription.cycle,
  );
  return { monthly, annual: monthly * 12 };
}

/** Active plans, most expensive first, each with its share of total spend. */
export function rankBySpend(
  subscriptions: readonly Subscription[],
  currency: CurrencyCode,
  fxToNgn: FxToNgn,
): CostRow[] {
  const rows = subscriptions
    .filter((subscription) => subscription.status === "active")
    .map((subscription) => ({
      subscription,
      ...costOf(subscription, currency, fxToNgn),
    }));
  const total = rows.reduce((sum, row) => sum + row.monthly, 0);

  return rows
    .map((row) => ({ ...row, share: total > 0 ? row.monthly / total : 0 }))
    .sort((a, b) => b.monthly - a.monthly);
}

/** What the user would save by cancelling every active plan tagged "cut". */
export function summarizeCuts(
  subscriptions: readonly Subscription[],
  currency: CurrencyCode,
  fxToNgn: FxToNgn,
): CutSummary {
  let monthly = 0;
  let count = 0;

  for (const subscription of subscriptions) {
    if (subscription.status !== "active" || subscription.decision !== "cut") {
      continue;
    }
    monthly += costOf(subscription, currency, fxToNgn).monthly;
    count += 1;
  }

  return { count, monthly, annual: monthly * 12 };
}
