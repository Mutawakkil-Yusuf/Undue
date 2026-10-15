import { describe, expect, it } from "vitest";
import type { Subscription } from "@/lib/domain/schema";
import { annualAmount, monthlyAmount, summarizeSpend } from "@/lib/domain/spend";
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
    emoji: "📦",
    category: "other",
    amount: 1000,
    currency: "NGN",
    cycle: { unit: "month", interval: 1 },
    nextRenewal: "2026-11-01",
    leadDays: 2,
    isTrial: false,
    cancelUrl: null,
    notes: null,
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
