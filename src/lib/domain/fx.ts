import { CURRENCY_CODES, type CurrencyCode } from "./schema";

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
