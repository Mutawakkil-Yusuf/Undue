import { describe, expect, it } from "vitest";
import {
  addMonths,
  civilDate,
  diffInDays,
  formatIsoDate,
  parseIsoDate,
  todayIso,
} from "@/lib/domain/date";

describe("parseIsoDate", () => {
  it("parses a valid date at UTC midnight", () => {
    const date = parseIsoDate("2026-10-15");
    expect(date.getUTCFullYear()).toBe(2026);
    expect(date.getUTCMonth()).toBe(9);
    expect(date.getUTCDate()).toBe(15);
    expect(date.getUTCHours()).toBe(0);
  });

  it("rejects malformed input", () => {
    expect(() => parseIsoDate("15-10-2026")).toThrow(RangeError);
    expect(() => parseIsoDate("nonsense")).toThrow(RangeError);
  });

  it("rejects impossible calendar dates", () => {
    expect(() => parseIsoDate("2026-02-30")).toThrow(RangeError);
    expect(() => parseIsoDate("2025-13-01")).toThrow(RangeError);
  });
});

describe("formatIsoDate", () => {
  it("round-trips a date", () => {
    expect(formatIsoDate(parseIsoDate("2026-01-05"))).toBe("2026-01-05");
  });
});

describe("addMonths", () => {
  it("clamps to the last day of a shorter month", () => {
    expect(formatIsoDate(addMonths(parseIsoDate("2026-01-31"), 1))).toBe("2026-02-28");
  });

  it("clamps across a leap February", () => {
    expect(formatIsoDate(addMonths(parseIsoDate("2028-01-31"), 1))).toBe("2028-02-29");
  });

  it("rolls over year boundaries", () => {
    expect(formatIsoDate(addMonths(parseIsoDate("2026-12-15"), 1))).toBe("2027-01-15");
  });
});

describe("diffInDays", () => {
  it("counts whole days between dates", () => {
    expect(diffInDays(parseIsoDate("2026-10-01"), parseIsoDate("2026-10-15"))).toBe(14);
  });

  it("is negative when the target is in the past", () => {
    expect(diffInDays(parseIsoDate("2026-10-15"), parseIsoDate("2026-10-01"))).toBe(-14);
  });
});

describe("civilDate and todayIso", () => {
  it("drops the time component using local calendar fields", () => {
    const clock = new Date(2026, 9, 15, 23, 30, 0);
    expect(todayIso(clock)).toBe("2026-10-15");
    expect(civilDate(clock).getUTCHours()).toBe(0);
  });
});
