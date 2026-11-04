import { describe, expect, it } from "vitest";
import {
  advance,
  advanceToFuture,
  cycleLabel,
  cycleShortLabel,
  monthsPerCycle,
} from "@/lib/domain/cycle";
import { formatIsoDate, parseIsoDate } from "@/lib/domain/date";
import type { Cycle } from "@/lib/domain/schema";

describe("advance", () => {
  it("advances by days and weeks", () => {
    expect(
      formatIsoDate(advance(parseIsoDate("2026-10-01"), { unit: "day", interval: 10 })),
    ).toBe("2026-10-11");
    expect(
      formatIsoDate(advance(parseIsoDate("2026-10-01"), { unit: "week", interval: 2 })),
    ).toBe("2026-10-15");
  });

  it("advances by months and clamps month-end", () => {
    expect(
      formatIsoDate(advance(parseIsoDate("2026-01-31"), { unit: "month", interval: 1 })),
    ).toBe("2026-02-28");
  });

  it("advances by years", () => {
    expect(
      formatIsoDate(advance(parseIsoDate("2026-06-10"), { unit: "year", interval: 1 })),
    ).toBe("2027-06-10");
  });

  it("keeps a month-end anchor instead of drifting", () => {
    const cycle: Cycle = { unit: "month", interval: 1 };
    const february = advance(parseIsoDate("2026-01-31"), cycle, 31);
    expect(formatIsoDate(february)).toBe("2026-02-28");
    expect(formatIsoDate(advance(february, cycle, 31))).toBe("2026-03-31");
  });

  it("rolls past renewals all the way to the next future cycle", () => {
    const next = advanceToFuture(
      parseIsoDate("2026-01-31"),
      { unit: "month", interval: 1 },
      parseIsoDate("2026-04-01"),
      31,
    );
    expect(formatIsoDate(next)).toBe("2026-04-30");
  });

  it("rolls a very old daily renewal forward without looping thousands of times", () => {
    const next = advanceToFuture(
      parseIsoDate("2020-01-01"),
      { unit: "day", interval: 1 },
      parseIsoDate("2026-10-01"),
    );
    expect(formatIsoDate(next)).toBe("2026-10-01");
  });

  it("jumps whole months before applying the billing anchor", () => {
    const next = advanceToFuture(
      parseIsoDate("2020-01-31"),
      { unit: "month", interval: 1 },
      parseIsoDate("2026-10-01"),
      31,
    );
    expect(formatIsoDate(next)).toBe("2026-10-31");
  });
});

describe("monthsPerCycle", () => {
  it("maps calendar cycles correctly", () => {
    expect(monthsPerCycle({ unit: "month", interval: 1 })).toBe(1);
    expect(monthsPerCycle({ unit: "month", interval: 3 })).toBe(3);
    expect(monthsPerCycle({ unit: "year", interval: 1 })).toBe(12);
  });

  it("approximates daily and weekly cycles", () => {
    expect(monthsPerCycle({ unit: "week", interval: 1 })).toBeCloseTo(0.2299, 3);
    expect(monthsPerCycle({ unit: "day", interval: 1 })).toBeCloseTo(0.0328, 3);
  });
});

describe("labels", () => {
  it("describes single-interval cycles", () => {
    const monthly: Cycle = { unit: "month", interval: 1 };
    expect(cycleLabel(monthly)).toBe("Every month");
    expect(cycleShortLabel(monthly)).toBe("monthly");
  });

  it("describes multi-interval cycles", () => {
    const quarterly: Cycle = { unit: "month", interval: 3 };
    expect(cycleLabel(quarterly)).toBe("Every 3 months");
    expect(cycleShortLabel(quarterly)).toBe("every 3 months");
  });
});
