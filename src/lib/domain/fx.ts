export interface LiveFxRates {
  readonly usd: number;
  readonly gbp: number;
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
  const usdRate = payload.rates?.USD;
  const gbpRate = payload.rates?.GBP;
  if (
    payload.result !== "success" ||
    !usdRate ||
    !gbpRate ||
    !Number.isFinite(usdRate) ||
    !Number.isFinite(gbpRate) ||
    usdRate <= 0 ||
    gbpRate <= 0
  ) {
    throw new Error("The exchange-rate service returned an unexpected response.");
  }

  return {
    usd: Math.round((1 / usdRate) * 100) / 100,
    gbp: Math.round((1 / gbpRate) * 100) / 100,
    updatedAt: new Date(
      (payload.time_last_update_unix ?? Date.now() / 1000) * 1000,
    ).toISOString(),
  };
}
