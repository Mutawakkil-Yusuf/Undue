import { describe, expect, it } from "vitest";
import type { Subscription } from "@/lib/domain/schema";
import {
  annualAmount,
  monthlyAmount,
  savingsFromCancelled,
  summarizeByCategory,
  summarizeSpend,
} from "@/lib/domain/spend";
import type { FxToNgn } from "@/lib/domain/currency";

const FX: FxToNgn = { NGN: 1, USD: 1600, GBP: 2000 };

describe("monthlyAmount", () => {
  it("passes through monthly amounts", () => {
    expect(monthlyAmount(1200, { unit: "month", interval: 1 })).toBe(1200);
  });

  it("divides annual amounts across the year", () => {
    expect(monthlyAmount(12_000, { unit: "year", interval: 1 })).toBe(1000);
  });

  it("divides quarterly amounts across three months", () => {
    expect(monthlyAmount(9000, { unit: "month", interval: 3 })).toBe(3000);
  });
});

describe("annualAmount", () => {
  it("multiplies the monthly figure by twelve", () => {
    expect(annualAmount(500, { unit: "month", interval: 1 })).toBe(6000);
  });
});

function buildSubscription(overrides: Partial<Subscription>): Subscription {
  return {
    id: "sub-1",
    name: "Test",
    serviceId: null,
    category: "other",
    amount: 1000,
    currency: "NGN",
    cycle: { unit: "month", interval: 1 },
    nextRenewal: "2026-11-01",
    leadDays: 2,
    isTrial: false,
    cancelUrl: null,
    notes: null,
    priceHistory: [],
    status: "active",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("summarizeSpend", () => {
  it("sums active monthly spend in the display currency", () => {
    const subscriptions = [
      buildSubscription({ amount: 2000, currency: "NGN" }),
      buildSubscription({ id: "sub-2", amount: 10, currency: "USD" }),
    ];
    const summary = summarizeSpend(subscriptions, "NGN", FX);
    expect(summary.monthly).toBe(18_000);
    expect(summary.annual).toBe(216_000);
  });

  it("ignores cancelled subscriptions", () => {
    const subscriptions = [
      buildSubscription({ amount: 2000 }),
      buildSubscription({ id: "sub-2", amount: 5000, status: "cancelled" }),
    ];
    expect(summarizeSpend(subscriptions, "NGN", FX).monthly).toBe(2000);
  });

  it("normalises non-monthly cycles", () => {
    const subscriptions = [
      buildSubscription({ amount: 12_000, cycle: { unit: "year", interval: 1 } }),
    ];
    expect(summarizeSpend(subscriptions, "NGN", FX).monthly).toBe(1000);
  });
});

describe("summarizeByCategory", () => {
  it("groups monthly spend by category, largest first", () => {
    const subscriptions = [
      buildSubscription({ category: "streaming", amount: 4000 }),
      buildSubscription({ id: "sub-2", category: "music", amount: 2000 }),
      buildSubscription({ id: "sub-3", category: "streaming", amount: 1000 }),
    ];
    const result = summarizeByCategory(subscriptions, "NGN", FX);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      category: "streaming",
      monthly: 5000,
      annual: 60_000,
      share: 5000 / 7000,
    });
    expect(result[1]?.category).toBe("music");
    expect(result[1]?.share).toBeCloseTo(2000 / 7000);
  });

  it("converts currencies and ignores cancelled plans", () => {
    const subscriptions = [
      buildSubscription({ category: "software", amount: 10, currency: "USD" }),
      buildSubscription({
        id: "sub-2",
        category: "software",
        amount: 5000,
        status: "cancelled",
      }),
    ];
    const result = summarizeByCategory(subscriptions, "NGN", FX);
    expect(result).toHaveLength(1);
    expect(result[0]?.monthly).toBe(16_000);
    expect(result[0]?.share).toBe(1);
  });

  it("returns an empty list when nothing is active", () => {
    expect(summarizeByCategory([], "NGN", FX)).toEqual([]);
  });
});

describe("savingsFromCancelled", () => {
  it("totals the monthly and annual value of cancelled plans", () => {
    const subscriptions = [
      buildSubscription({ status: "cancelled", amount: 3000 }),
      buildSubscription({
        id: "sub-2",
        status: "cancelled",
        amount: 12_000,
        cycle: { unit: "year", interval: 1 },
      }),
      buildSubscription({ id: "sub-3", amount: 9000 }),
    ];
    const savings = savingsFromCancelled(subscriptions, "NGN", FX);
    expect(savings.count).toBe(2);
    expect(savings.monthly).toBe(4000);
    expect(savings.annual).toBe(48_000);
  });

  it("is zero without cancelled plans", () => {
    expect(savingsFromCancelled([buildSubscription({})], "NGN", FX)).toEqual({
      count: 0,
      monthly: 0,
      annual: 0,
    });
  });
});
