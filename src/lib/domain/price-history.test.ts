import { describe, expect, it } from "vitest";
import { latestPrice, priceChange, recordPrice, type PriceInput } from "./price-history";
import type { PricePoint } from "./schema";

const p = (
  at: string,
  amount: number,
  currency: PricePoint["currency"] = "NGN",
): PricePoint => ({
  at,
  amount,
  currency,
});

describe("recordPrice", () => {
  it("seeds an empty history with the first price", () => {
    const input: PriceInput = { at: "2026-01-01", amount: 1000, currency: "NGN" };
    expect(recordPrice([], input)).toEqual([p("2026-01-01", 1000)]);
  });

  it("appends when the amount changes", () => {
    const history = [p("2026-01-01", 1000)];
    const next = recordPrice(history, {
      at: "2026-02-01",
      amount: 1200,
      currency: "NGN",
    });
    expect(next).toHaveLength(2);
    expect(next[1]).toEqual(p("2026-02-01", 1200));
  });

  it("does not append a duplicate amount", () => {
    const history = [p("2026-01-01", 1000)];
    const next = recordPrice(history, {
      at: "2026-02-01",
      amount: 1000,
      currency: "NGN",
    });
    expect(next).toHaveLength(1);
    expect(next).not.toBe(history);
  });

  it("treats a currency change as a new point", () => {
    const history = [p("2026-01-01", 1000, "NGN")];
    const next = recordPrice(history, {
      at: "2026-02-01",
      amount: 1000,
      currency: "USD",
    });
    expect(next).toHaveLength(2);
  });
});

describe("latestPrice", () => {
  it("returns null for an empty history", () => {
    expect(latestPrice([])).toBeNull();
  });

  it("returns the final entry", () => {
    expect(latestPrice([p("2026-01-01", 1000), p("2026-02-01", 1500)])).toEqual(
      p("2026-02-01", 1500),
    );
  });
});

describe("priceChange", () => {
  it("reports an increase with delta and percent", () => {
    const change = priceChange([p("2026-01-01", 1000), p("2026-02-01", 1500)]);
    expect(change).not.toBeNull();
    expect(change?.delta).toBe(500);
    expect(change?.pct).toBe(0.5);
    expect(change?.increased).toBe(true);
  });

  it("reports a decrease as not increased", () => {
    const change = priceChange([p("2026-01-01", 2000), p("2026-02-01", 1500)]);
    expect(change?.increased).toBe(false);
    expect(change?.delta).toBe(-500);
  });

  it("returns null with fewer than two points", () => {
    expect(priceChange([])).toBeNull();
    expect(priceChange([p("2026-01-01", 1000)])).toBeNull();
  });

  it("returns null when the currency changed", () => {
    expect(
      priceChange([p("2026-01-01", 1000, "NGN"), p("2026-02-01", 20, "USD")]),
    ).toBeNull();
  });

  it("returns null percent when the starting price was zero", () => {
    const change = priceChange([p("2026-01-01", 0), p("2026-02-01", 500)]);
    expect(change?.pct).toBeNull();
    expect(change?.increased).toBe(true);
  });
});
