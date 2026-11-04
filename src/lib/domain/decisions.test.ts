import { describe, expect, it } from "vitest";
import type { FxToNgn } from "@/lib/domain/currency";
import { costOf, rankBySpend, summarizeCuts } from "@/lib/domain/decisions";
import type { Subscription } from "@/lib/domain/schema";

const FX: FxToNgn = { NGN: 1, USD: 1600, GBP: 2000 };

function sub(overrides: Partial<Subscription>): Subscription {
  return {
    id: "sub-1",
    name: "Test",
    serviceId: null,
    category: "other",
    amount: 1000,
    currency: "NGN",
    cycle: { unit: "month", interval: 1 },
    nextRenewal: "2026-12-01",
    leadDays: 3,
    isTrial: false,
    cancelUrl: null,
    notes: null,
    priceHistory: [],
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("costOf", () => {
  it("spreads a yearly plan across months", () => {
    const row = costOf(
      sub({ amount: 12_000, cycle: { unit: "year", interval: 1 } }),
      "NGN",
      FX,
    );
    expect(row.monthly).toBe(1000);
    expect(row.annual).toBe(12_000);
  });

  it("uses the user's share of a split plan", () => {
    const row = costOf(sub({ amount: 4000, shareCount: 4 }), "NGN", FX);
    expect(row.monthly).toBe(1000);
  });

  it("converts to the display currency", () => {
    const row = costOf(sub({ amount: 10, currency: "USD" }), "NGN", FX);
    expect(row.monthly).toBe(16_000);
  });
});

describe("rankBySpend", () => {
  it("orders active plans by monthly cost and computes shares", () => {
    const rows = rankBySpend(
      [
        sub({ id: "a", amount: 1000 }),
        sub({ id: "b", amount: 3000 }),
        sub({ id: "c", amount: 9999, status: "cancelled" }),
      ],
      "NGN",
      FX,
    );
    expect(rows.map((row) => row.subscription.id)).toEqual(["b", "a"]);
    expect(rows[0]?.share).toBeCloseTo(0.75);
    expect(rows[1]?.share).toBeCloseTo(0.25);
  });

  it("returns nothing when there are no active plans", () => {
    expect(rankBySpend([], "NGN", FX)).toEqual([]);
  });
});

describe("summarizeCuts", () => {
  it("adds up only active plans tagged cut", () => {
    const summary = summarizeCuts(
      [
        sub({ id: "a", amount: 1000, decision: "cut" }),
        sub({ id: "b", amount: 2000, decision: "cut" }),
        sub({ id: "c", amount: 5000, decision: "keep" }),
        sub({ id: "d", amount: 700, decision: "cut", status: "cancelled" }),
        sub({ id: "e", amount: 400 }),
      ],
      "NGN",
      FX,
    );
    expect(summary).toEqual({ count: 2, monthly: 3000, annual: 36_000 });
  });
});
