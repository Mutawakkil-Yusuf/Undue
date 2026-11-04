import { describe, expect, it } from "vitest";
import {
  detectPaymentRisks,
  detectPriceMoves,
  findOverlappingGroups,
  findStaleUnsurePlans,
  upcomingCashNeed,
} from "./smart";
import { DEFAULT_FX_TO_NGN } from "./currency";
import type { Subscription } from "./schema";

function base(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: "sub-1",
    name: "Netflix",
    serviceId: null,
    category: "streaming",
    amount: 4400,
    currency: "NGN",
    cycle: { unit: "month", interval: 1 },
    nextRenewal: "2026-11-05",
    billingDay: 5,
    leadDays: 2,
    isTrial: false,
    trialEndsAt: null,
    paidVia: "card",
    chargeStatus: "unknown",
    decision: null,
    decisionUpdatedAt: null,
    myShare: null,
    cancelUrl: null,
    notes: null,
    priceHistory: [{ at: "2026-10-01", amount: 4000, currency: "NGN" }],
    status: "active",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("findOverlappingGroups", () => {
  it("groups active plans with two or more in one category", () => {
    const groups = findOverlappingGroups(
      [
        base({ id: "a", name: "A", category: "streaming", amount: 1000 }),
        base({ id: "b", name: "B", category: "streaming", amount: 2000 }),
        base({ id: "c", name: "C", category: "cloud", amount: 5000 }),
      ],
      "NGN",
      DEFAULT_FX_TO_NGN,
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.count).toBe(2);
    expect(groups[0]?.monthly).toBeCloseTo(3000);
    expect(groups[0]?.annual).toBeCloseTo(36_000);
  });

  it("ignores cancelled plans", () => {
    const groups = findOverlappingGroups(
      [base({ id: "a" }), base({ id: "b", status: "cancelled" })],
      "NGN",
      DEFAULT_FX_TO_NGN,
    );
    expect(groups).toHaveLength(0);
  });
});

describe("upcomingCashNeed", () => {
  it("sums upcoming charges and reports the largest one", () => {
    const result = upcomingCashNeed(
      [
        base({ id: "a", nextRenewal: "2026-11-02", billingDay: 2, amount: 5000 }),
        base({
          id: "b",
          name: "Daily",
          cycle: { unit: "day", interval: 1 },
          nextRenewal: "2026-11-01",
          billingDay: 1,
          amount: 100,
        }),
      ],
      {
        now: new Date("2026-11-01T12:00:00Z"),
        days: 7,
        displayCurrency: "NGN",
        fxToNgn: DEFAULT_FX_TO_NGN,
      },
    );

    // Sorted by date: b starts on the 1st, a joins on the 2nd.
    expect(result.charges.map((charge) => charge.subscriptionId)).toEqual([
      "b",
      "a",
      "b",
      "b",
      "b",
      "b",
      "b",
      "b",
    ]);
    expect(result.amount).toBeCloseTo(5_700);
    expect(result.largest?.subscriptionId).toBe("a");
  });
});

describe("price moves and payment risks", () => {
  it("detects price increases and failed charges", () => {
    const moves = detectPriceMoves([
      base({
        id: "a",
        priceHistory: [
          { at: "2026-01-01", amount: 1000, currency: "NGN" },
          { at: "2026-02-01", amount: 1200, currency: "NGN" },
        ],
      }),
    ]);
    expect(moves[0]?.change.delta).toBe(200);

    const risks = detectPaymentRisks(
      [
        base({ id: "b", chargeStatus: "failed", nextRenewal: "2026-11-03" }),
        base({ id: "c", chargeStatus: "paid", nextRenewal: "2026-11-03" }),
      ],
      new Date("2026-11-01T12:00:00Z"),
    );
    expect(risks.map((risk) => risk.subscription.id)).toEqual(["b"]);
  });
});

describe("findStaleUnsurePlans", () => {
  it("returns only unsure plans older than the threshold", () => {
    const result = findStaleUnsurePlans(
      [
        base({
          id: "old",
          name: "Old",
          amount: 9000,
          decision: "unsure",
          decisionUpdatedAt: "2026-05-01T00:00:00.000Z",
        }),
        base({
          id: "new",
          name: "New",
          amount: 9000,
          decision: "unsure",
          decisionUpdatedAt: "2026-10-20T00:00:00.000Z",
        }),
      ],
      {
        now: new Date("2026-11-01T12:00:00Z"),
        olderThanDays: 30,
        displayCurrency: "NGN",
        fxToNgn: DEFAULT_FX_TO_NGN,
      },
    );

    expect(result.map((item) => item.subscription.id)).toEqual(["old"]);
    expect(result[0]?.annual).toBeCloseTo(108_000);
  });
});
