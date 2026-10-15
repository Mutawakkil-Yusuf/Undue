import { describe, expect, it } from "vitest";
import type { FxToNgn } from "./currency";
import {
  projectSpend,
  projectionMonthFullLabel,
  projectionMonthLabel,
} from "./projection";
import type { Subscription } from "./schema";

const FX: FxToNgn = { NGN: 1, USD: 1600, GBP: 2000 };

function buildSubscription(overrides: Partial<Subscription> = {}): Subscription {
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

const REFERENCE = new Date(Date.UTC(2026, 9, 15));

function project(subscriptions: Subscription[], months = 12) {
  return projectSpend(subscriptions, {
    referenceDate: REFERENCE,
    displayCurrency: "NGN",
    fxToNgn: FX,
    months,
  });
}

describe("projectSpend", () => {
  it("returns one bucket per month starting this month", () => {
    const months = project([]);
    expect(months).toHaveLength(12);
    expect(months[0]?.month).toBe("2026-10");
    expect(months[11]?.month).toBe("2027-09");
    expect(months.every((month) => month.total === 0)).toBe(true);
  });

  it("spreads a monthly charge across the following months", () => {
    const months = project([buildSubscription({ amount: 2000 })]);
    const totals = Object.fromEntries(months.map((month) => [month.month, month.total]));
    expect(totals["2026-10"]).toBe(0);
    expect(totals["2026-11"]).toBe(2000);
    expect(totals["2027-09"]).toBe(2000);
    const charged = months.filter((month) => month.total > 0);
    expect(charged).toHaveLength(11);
  });

  it("lands a yearly charge in a single month", () => {
    const months = project([
      buildSubscription({
        amount: 24_000,
        cycle: { unit: "year", interval: 1 },
        nextRenewal: "2027-01-10",
      }),
    ]);
    const charged = months.filter((month) => month.total > 0);
    expect(charged).toHaveLength(1);
    expect(charged[0]?.month).toBe("2027-01");
    expect(charged[0]?.total).toBe(24_000);
  });

  it("rolls a past renewal forward into the window", () => {
    const months = project([
      buildSubscription({ amount: 1000, nextRenewal: "2026-08-01" }),
    ]);
    expect(months[0]?.month).toBe("2026-10");
    expect(months[0]?.total).toBe(1000);
    expect(months.filter((month) => month.total > 0)).toHaveLength(12);
  });

  it("includes multiple charges for a weekly plan", () => {
    const months = project([
      buildSubscription({
        amount: 500,
        cycle: { unit: "week", interval: 1 },
        nextRenewal: "2026-10-05",
      }),
    ]);
    const october = months[0];
    expect(october?.total).toBeGreaterThan(500);
  });

  it("converts amounts to the display currency", () => {
    const months = project([buildSubscription({ amount: 10, currency: "USD" })]);
    const november = months.find((month) => month.month === "2026-11");
    expect(november?.total).toBe(16_000);
  });

  it("ignores cancelled subscriptions", () => {
    const months = project([buildSubscription({ status: "cancelled" })]);
    expect(months.every((month) => month.total === 0)).toBe(true);
  });
});

describe("projection labels", () => {
  it("formats a short month label", () => {
    expect(projectionMonthLabel("2026-11")).toBe("Nov");
  });

  it("formats a full month label with the year", () => {
    expect(projectionMonthFullLabel("2026-11")).toBe("November 2026");
  });
});
