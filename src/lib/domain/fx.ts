import { CURRENCY_CODES, type CurrencyCode } from "./schema";
import { DEFAULT_FX_TO_NGN } from "./currency";

/** Naira per unit for each currency, as returned by a refresh. */
export type FxRates = Partial<Record<CurrencyCode, number>>;

const RATES_URL = "https://open.er-api.com/v6/latest/USD";
const TIMEOUT_MS = 8_000;
/** A refreshed rate may be at most this many times off the built-in starting rate. */
const SANITY_FACTOR = 20;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

/**
 * Turns a "USD base" response ({ rates: { NGN, EUR, ... } }) into naira per
 * unit. Currencies missing from the response are skipped; anything implausible
 * is rejected so a bad response can never silently corrupt every total.
 */
export function parseRates(json: unknown): FxRates {
  const rates =
    typeof json === "object" && json !== null && "rates" in json
      ? (json as { rates: Record<string, unknown> }).rates
      : null;
  const ngnPerUsd = rates?.NGN;
  if (!rates || !isPositiveNumber(ngnPerUsd)) {
    throw new Error("The rates response was not in the expected format.");
  }
  if (ngnPerUsd < 50 || ngnPerUsd > 20_000) {
    throw new Error("The rates looked wrong, so they were not applied.");
  }

  const result: FxRates = { USD: round2(ngnPerUsd) };

  for (const code of CURRENCY_CODES) {
    if (code === "NGN" || code === "USD") {
      continue;
    }
    const perUsd = rates[code];
    if (!isPositiveNumber(perUsd)) {
      continue;
    }
    const inNgn = ngnPerUsd / perUsd;
    const start = DEFAULT_FX_TO_NGN[code];
    if (inNgn < start / SANITY_FACTOR || inNgn > start * SANITY_FACTOR) {
      throw new Error("The rates looked wrong, so they were not applied.");
    }
    result[code] = round2(inNgn);
  }

  return result;
}

export interface LiveFxRates {
  readonly rates: Readonly<Partial<Record<CurrencyCode, number>>>;
  readonly updatedAt: string;
}

interface ErApiResponse {
  result?: string;
  rates?: Record<string, number>;
  time_last_update_unix?: number;
}

/**
 * Optional, user-triggered rate refresh. No subscription data is sent; only a
 * request for public NGN exchange rates. Manual rates remain the source of
 * truth when the user does not refresh.
 */
export async function fetchLiveFxRates(signal?: AbortSignal): Promise<LiveFxRates> {
  const response = await fetch("https://open.er-api.com/v6/latest/NGN", {
    cache: "no-store",
    ...(signal ? { signal } : {}),
  });
  if (!response.ok) {
    throw new Error("Could not reach the exchange-rate service.");
  }

  const payload = (await response.json()) as ErApiResponse;
  if (payload.result !== "success") {
    throw new Error("The exchange-rate service returned an unexpected response.");
  }

  const rates: Partial<Record<CurrencyCode, number>> = { NGN: 1 };
  for (const code of CURRENCY_CODES) {
    if (code === "NGN") {
      continue;
    }
    const perNgn = payload.rates?.[code];
    if (typeof perNgn !== "number" || !Number.isFinite(perNgn) || perNgn <= 0) {
      continue;
    }
    rates[code] = Math.round((1 / perNgn) * 100) / 100;
  }

  if (Object.keys(rates).length <= 1) {
    throw new Error("The exchange-rate service returned no usable rates.");
  }

  return {
    rates,
    updatedAt: new Date(
      (payload.time_last_update_unix ?? Date.now() / 1000) * 1000,
    ).toISOString(),
  };
}
