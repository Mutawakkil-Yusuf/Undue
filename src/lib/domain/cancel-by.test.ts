import { describe, expect, it } from "vitest";
import { computeCancelWindow } from "@/lib/domain/cancel-by";

const REFERENCE = new Date(2026, 9, 1, 12, 0, 0);

describe("computeCancelWindow", () => {
  it("subtracts the lead time from the renewal date", () => {
    const window = computeCancelWindow(
      { nextRenewal: "2026-10-20", leadDays: 3 },
      REFERENCE,
    );
    expect(window.cancelBy).toBe("2026-10-17");
    expect(window.daysUntilRenewal).toBe(19);
    expect(window.daysUntilCancelBy).toBe(16);
    expect(window.urgency).toBe("safe");
  });

  it("marks an imminent cancel deadline as urgent", () => {
    const window = computeCancelWindow(
      { nextRenewal: "2026-10-04", leadDays: 2 },
      REFERENCE,
    );
    expect(window.cancelBy).toBe("2026-10-02");
    expect(window.daysUntilCancelBy).toBe(1);
    expect(window.urgency).toBe("urgent");
  });

  it("marks the cancel day itself as today", () => {
    const window = computeCancelWindow(
      { nextRenewal: "2026-10-03", leadDays: 2 },
      REFERENCE,
    );
    expect(window.daysUntilCancelBy).toBe(0);
    expect(window.urgency).toBe("today");
  });

  it("flags a passed cancel window while the renewal is pending", () => {
    const window = computeCancelWindow(
      { nextRenewal: "2026-10-02", leadDays: 2 },
      REFERENCE,
    );
    expect(window.daysUntilCancelBy).toBe(-1);
    expect(window.urgency).toBe("missed");
  });

  it("treats a passed renewal as past", () => {
    const window = computeCancelWindow(
      { nextRenewal: "2026-09-29", leadDays: 2 },
      REFERENCE,
    );
    expect(window.urgency).toBe("past");
  });

  it("classifies deadlines within a week as soon", () => {
    const window = computeCancelWindow(
      { nextRenewal: "2026-10-09", leadDays: 2 },
      REFERENCE,
    );
    expect(window.urgency).toBe("soon");
  });
});
