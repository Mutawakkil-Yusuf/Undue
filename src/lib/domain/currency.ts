import type { CurrencyCode } from "./schema";

export type FxToNgn = Readonly<Record<CurrencyCode, number>>;

export const DEFAULT_FX_TO_NGN: FxToNgn = {
  NGN: 1,
  USD: 1600,
  GBP: 2000,
};

const LOCALES: Record<CurrencyCode, string> = {
  NGN: "en-NG",
  USD: "en-US",
  GBP: "en-GB",
};

export function convertToNgn(
  amount: number,
  from: CurrencyCode,
  fxToNgn: FxToNgn,
): number {
  return amount * fxToNgn[from];
}

export function convert(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  fxToNgn: FxToNgn,
): number {
  if (from === to) {
    return amount;
  }
  return convertToNgn(amount, from, fxToNgn) / fxToNgn[to];
}

const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: CurrencyCode): Intl.NumberFormat {
  const cached = formatterCache.get(currency);
  if (cached) {
    return cached;
  }
  const formatter = new Intl.NumberFormat(LOCALES[currency], {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  formatterCache.set(currency, formatter);
  return formatter;
}

export function formatMoney(amount: number, currency: CurrencyCode): string {
  return getFormatter(currency).format(amount);
}

export function formatMoneyRounded(amount: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat(LOCALES[currency], {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
