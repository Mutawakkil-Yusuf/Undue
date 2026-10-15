import { describe, expect, it } from "vitest";
import {
  convert,
  convertToNgn,
  DEFAULT_FX_TO_NGN,
  formatMoney,
  type FxToNgn,
} from "@/lib/domain/currency";

const FX: FxToNgn = { NGN: 1, USD: 1600, GBP: 2000 };

describe("convertToNgn", () => {
  it("multiplies by the configured rate", () => {
    expect(convertToNgn(10, "USD", FX)).toBe(16_000);
    expect(convertToNgn(2500, "NGN", FX)).toBe(2500);
  });
});

describe("convert", () => {
  it("returns the same amount for identical currencies", () => {
    expect(convert(500, "USD", "USD", FX)).toBe(500);
  });

  it("converts across currencies via the naira anchor", () => {
    expect(convert(1600, "NGN", "USD", FX)).toBe(1);
    expect(convert(1, "GBP", "USD", FX)).toBe(1.25);
  });
});

describe("formatMoney", () => {
  it("produces a currency-formatted string", () => {
    const formatted = formatMoney(2500, "NGN");
    expect(formatted).toContain("2,500");
  });

  it("honours the default naira rate of one", () => {
    expect(DEFAULT_FX_TO_NGN.NGN).toBe(1);
  });
});
