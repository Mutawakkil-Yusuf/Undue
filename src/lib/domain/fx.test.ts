import { describe, expect, it } from "vitest";
import { parseRates } from "./fx";

describe("parseRates", () => {
  it("converts a USD-base response into naira per unit", () => {
    const rates = parseRates({ rates: { NGN: 1500, GBP: 0.75, EUR: 0.9 } });
    expect(rates.USD).toBe(1500);
    expect(rates.GBP).toBe(2000);
    expect(rates.EUR).toBeCloseTo(1666.67, 2);
  });

  it("skips currencies the response does not include", () => {
    expect(parseRates({ rates: { NGN: 1500 } })).toEqual({ USD: 1500 });
  });

  it("rejects malformed responses", () => {
    expect(() => parseRates(null)).toThrow();
    expect(() => parseRates({ rates: { NGN: "1500", GBP: 0.8 } })).toThrow();
    expect(() => parseRates({ rates: { GBP: 0.8 } })).toThrow();
  });

  it("rejects implausible values instead of corrupting totals", () => {
    expect(() => parseRates({ rates: { NGN: 3, GBP: 0.8 } })).toThrow(/wrong/);
    expect(() => parseRates({ rates: { NGN: 99_999_999, GBP: 0.8 } })).toThrow(/wrong/);
    expect(() => parseRates({ rates: { NGN: 1500, GBP: 0.0001 } })).toThrow(/wrong/);
  });
});
