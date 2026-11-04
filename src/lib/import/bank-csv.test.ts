import { describe, expect, it } from "vitest";
import { detectRecurringCharges } from "./bank-csv";

const SAMPLE = `date,description,debit,credit
2026-01-05,POS NETFLIX.COM card,4400.00,
2026-02-05,POS NETFLIX.COM card,4400.00,
2026-03-05,POS NETFLIX.COM card,4400.00,
2026-01-11,POS SPOTIFY AB,2900.00,
2026-02-11,POS SPOTIFY AB,2900.00,
2026-03-11,POS SPOTIFY AB,2900.00,
2026-03-20,TRANSFER TO SAVINGS,15000.00,
2026-04-20,TRANSFER TO SAVINGS,30000.00,
2026-02-11,TRANSFER IN salary,500000.00,`;

describe("detectRecurringCharges", () => {
  it("finds steady monthly charges and ignores credits and irregular rows", () => {
    const result = detectRecurringCharges(SAMPLE, {
      now: new Date("2026-03-20T12:00:00Z"),
    });

    expect(result.transactions).toBe(9);
    expect(result.entries.map((entry) => entry.name).sort()).toEqual([
      "Netflix",
      "Spotify",
    ]);
    expect(result.entries.map((entry) => entry.amount).sort()).toEqual([2900, 4400]);
    expect(result.entries.every((entry) => entry.cycle.unit === "month")).toBe(true);
    expect(result.entries.every((entry) => entry.nextRenewal > "2026-03-01")).toBe(true);
    expect(
      result.entries.every((entry) => entry.billingDay === 5 || entry.billingDay === 11),
    ).toBe(true);
    expect(result.skipped).toBeGreaterThan(0);
  });

  it("returns nothing when there are fewer than two matching charges", () => {
    expect(
      detectRecurringCharges(
        `date,description,debit,credit\n2026-01-05,POS NETFLIX.COM,4400.00,`,
      ).entries,
    ).toEqual([]);
  });

  it("returns an empty result for a statement without usable debit columns", () => {
    expect(detectRecurringCharges("hello\nworld").entries).toEqual([]);
  });
});
