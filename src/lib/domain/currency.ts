import type { CurrencyCode } from "./schema";

export type FxToNgn = Readonly<Partial<Record<CurrencyCode, number>>>;

export const DEFAULT_FX_TO_NGN: Readonly<Record<CurrencyCode, number>> = {
  NGN: 1,
  USD: 1600,
  GBP: 2000,
  EUR: 1750,
  CAD: 1150,
  AUD: 1050,
  ZAR: 90,
  GHS: 110,
  KES: 12,
  INR: 18,
  AED: 435,
  JPY: 10.3,
  CNY: 225,
  CHF: 1800,
  BRL: 280,
  MXN: 82,
};

const LOCALES: Record<CurrencyCode, string> = {
  NGN: "en-NG",
  USD: "en-US",
  GBP: "en-GB",
  EUR: "de-DE",
  CAD: "en-CA",
  AUD: "en-AU",
  ZAR: "en-ZA",
  GHS: "en-GH",
  KES: "en-KE",
  INR: "en-IN",
  AED: "en-AE",
  JPY: "ja-JP",
  CNY: "zh-CN",
  CHF: "de-CH",
  BRL: "pt-BR",
  MXN: "es-MX",
};

/** Naira per unit of `code`, falling back to the built-in starting rate. */
export function rateOf(fxToNgn: FxToNgn, code: CurrencyCode): number {
  if (code === "NGN") {
    return 1;
  }
  return fxToNgn[code] ?? DEFAULT_FX_TO_NGN[code];
}

export function convertToNgn(
  amount: number,
  from: CurrencyCode,
  fxToNgn: FxToNgn,
): number {
  return amount * rateOf(fxToNgn, from);
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
  return convertToNgn(amount, from, fxToNgn) / rateOf(fxToNgn, to);
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
