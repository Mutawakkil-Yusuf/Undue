import type { CurrencyCode, PricePoint } from "./schema";

export interface PriceInput {
  readonly at: string;
  readonly amount: number;
  readonly currency: CurrencyCode;
}

export interface PriceChange {
  readonly from: PricePoint;
  readonly to: PricePoint;
  readonly delta: number;
  readonly pct: number | null;
  readonly increased: boolean;
}

export function latestPrice(history: readonly PricePoint[]): PricePoint | null {
  if (history.length === 0) {
    return null;
  }
  return history[history.length - 1] ?? null;
}

export function recordPrice(
  history: readonly PricePoint[],
  input: PriceInput,
): PricePoint[] {
  const previous = latestPrice(history);
  if (
    previous &&
    previous.amount === input.amount &&
    previous.currency === input.currency
  ) {
    return [...history];
  }
  return [...history, { at: input.at, amount: input.amount, currency: input.currency }];
}

export function priceChange(history: readonly PricePoint[]): PriceChange | null {
  const from = history[0];
  const to = latestPrice(history);
  if (!from || !to || from === to) {
    return null;
  }
  if (from.currency !== to.currency) {
    return null;
  }

  const delta = to.amount - from.amount;
  return {
    from,
    to,
    delta,
    pct: from.amount === 0 ? null : delta / from.amount,
    increased: delta > 0,
  };
}
