import { describe, expect, it } from "vitest";
import { parseQuickEntries } from "./quick-entry";

const SAMPLE = `12/10/2026 DEBIT NGN 4,400.00 NETFLIX.COM card ending 4421
2026-10-14 POS PURCHASE SPOTIFY NGN 1,900.00
15 Oct 2026 WEB DEBIT DSTV NGN 12,500.00`;

describe("parseQuickEntries", () => {
  it("reads the amount after a date instead of treating the date as the amount", () => {
    const entries = parseQuickEntries(SAMPLE, new Date("2026-10-01T12:00:00Z"));

    expect(entries.map((entry) => entry.amount)).toEqual([4400, 1900, 12500]);
    expect(entries.map((entry) => entry.nextRenewal)).toEqual([
      "2026-10-12",
      "2026-10-14",
      "2026-10-15",
    ]);
    expect(entries.map((entry) => entry.billingDay)).toEqual([12, 14, 15]);
    expect(entries[0]?.name).toBe("Netflix");
  });

  it("keeps the original billing day when a month-end date rolls forward", () => {
    const [entry] = parseQuickEntries(
      "31/01/2026 DEBIT NGN 4,400.00 NETFLIX.COM",
      new Date("2026-03-01T12:00:00Z"),
    );

    expect(entry?.nextRenewal).toBe("2026-03-31");
    expect(entry?.billingDay).toBe(31);
  });

  it("keeps cents when a merchant name follows the amount", () => {
    const [entry] = parseQuickEntries(
      "12/10/2026 DEBIT NGN 4,400.99 NETFLIX.COM card ending 4421",
      new Date("2026-10-01T12:00:00Z"),
    );

    expect(entry?.amount).toBe(4400.99);
    expect(entry?.name).toBe("Netflix");
  });

  it("rolls a past charge date to the next future cycle", () => {
    const [entry] = parseQuickEntries(
      "12/10/2026 DEBIT NGN 4,400.00 NETFLIX.COM",
      new Date("2026-11-03T12:00:00Z"),
    );

    expect(entry?.nextRenewal).toBe("2026-11-12");
  });

  it("parses a small CSV export with named columns", () => {
    const entries = parseQuickEntries(
      `name,amount,date,currency,cycle\nNetflix,4400,2026-10-12,NGN,monthly\nSpotify,1900,2026-10-14,NGN,monthly`,
      new Date("2026-10-01T12:00:00Z"),
    );

    expect(entries).toHaveLength(2);
    expect(entries.map((entry) => entry.amount)).toEqual([4400, 1900]);
    expect(entries[0]?.name).toBe("Netflix");
  });

  it("does not invent an entry when no positive amount is present", () => {
    expect(parseQuickEntries("No charge here", new Date("2026-10-01"))).toEqual([]);
  });
});
