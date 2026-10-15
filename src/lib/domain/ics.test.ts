import { describe, expect, it } from "vitest";
import {
  buildCalendar,
  buildReminderEvent,
  calendarFilename,
  escapeIcsText,
  foldIcsLine,
  formatIcsDate,
  formatIcsFloatingDateTime,
  formatIcsUtcStamp,
} from "./ics";
import type { Subscription } from "./schema";

function makeSubscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: "sub-1",
    name: "Netflix",
    serviceId: "netflix",
    category: "streaming",
    amount: 4400,
    currency: "NGN",
    cycle: { unit: "month", interval: 1 },
    nextRenewal: "2026-11-01",
    leadDays: 2,
    isTrial: false,
    cancelUrl: "https://example.com/cancel",
    notes: null,
    priceHistory: [],
    status: "active",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

const NOW = new Date(Date.UTC(2026, 9, 15, 12, 0, 0));

describe("escapeIcsText", () => {
  it("escapes reserved characters", () => {
    expect(escapeIcsText("a,b;c\\d")).toBe("a\\,b\\;c\\\\d");
  });

  it("turns newlines into the ICS escape", () => {
    expect(escapeIcsText("line1\nline2")).toBe("line1\\nline2");
  });
});

describe("foldIcsLine", () => {
  it("leaves short lines untouched", () => {
    expect(foldIcsLine("SUMMARY:Hi")).toBe("SUMMARY:Hi");
  });

  it("folds long lines with a leading space on continuations", () => {
    const long = "DESCRIPTION:" + "x".repeat(200);
    const folded = foldIcsLine(long);
    const parts = folded.split("\r\n");
    expect(parts.length).toBeGreaterThan(1);
    expect(parts[0]?.length).toBe(75);
    for (const part of parts.slice(1)) {
      expect(part.startsWith(" ")).toBe(true);
    }
    expect(parts.join("").replace(/\s/g, "")).toBe(long.replace(/\s/g, ""));
  });
});

describe("date formatting", () => {
  it("formats a date-only value", () => {
    expect(formatIcsDate(new Date(Date.UTC(2026, 0, 5)))).toBe("20260105");
  });

  it("formats a floating local date-time", () => {
    expect(formatIcsFloatingDateTime(new Date(Date.UTC(2026, 0, 5)), 9, 30)).toBe(
      "20260105T093000",
    );
  });

  it("formats a UTC timestamp", () => {
    expect(formatIcsUtcStamp(NOW)).toBe("20261015T120000Z");
  });
});

describe("buildReminderEvent", () => {
  it("uses the cancel-by date as an all-day-ish 09:00 event", () => {
    const event = buildReminderEvent(makeSubscription(), NOW);
    expect(event).toContain("DTSTART:20261030T090000");
    expect(event).toContain("DTEND:20261030T093000");
  });

  it("includes identity, summary and alarm", () => {
    const event = buildReminderEvent(makeSubscription(), NOW);
    expect(event).toContain("BEGIN:VEVENT");
    expect(event).toContain("UID:sub-1@undue");
    expect(event).toContain("DTSTAMP:20261015T120000Z");
    expect(event).toContain("SUMMARY:Last day to cancel Netflix");
    expect(event).toContain("BEGIN:VALARM");
    expect(event).toContain("END:VEVENT");
  });

  it("adds the cancellation URL when present", () => {
    const event = buildReminderEvent(makeSubscription(), NOW);
    expect(event).toContain("URL:https://example.com/cancel");
  });

  it("omits the URL when there is none", () => {
    const event = buildReminderEvent(makeSubscription({ cancelUrl: null }), NOW);
    expect(event).not.toContain("URL:");
  });

  it("respects the lead-days window", () => {
    const event = buildReminderEvent(makeSubscription({ leadDays: 7 }), NOW);
    expect(event).toContain("DTSTART:20261025T090000");
  });
});

describe("buildCalendar", () => {
  it("wraps events in a VCALENDAR with CRLF line endings", () => {
    const calendar = buildCalendar([makeSubscription()], NOW);
    expect(calendar.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(calendar).toContain("VERSION:2.0");
    expect(calendar).toContain("BEGIN:VEVENT");
    expect(calendar.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
  });

  it("includes every subscription as its own event", () => {
    const calendar = buildCalendar(
      [
        makeSubscription({ id: "a", name: "Netflix" }),
        makeSubscription({ id: "b", name: "DStv" }),
      ],
      NOW,
    );
    expect(calendar.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(calendar).toContain("UID:a@undue");
    expect(calendar).toContain("UID:b@undue");
  });
});

describe("calendarFilename", () => {
  it("names the file with the current date", () => {
    expect(calendarFilename(NOW)).toBe("undue-reminders-2026-10-15.ics");
  });
});
