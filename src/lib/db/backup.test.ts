import { describe, expect, it } from "vitest";
import { BACKUP_VERSION, parseBackup } from "./backup";

const v1Backup = {
  app: "undue",
  version: 1,
  exportedAt: "2026-01-01T00:00:00.000Z",
  settings: {
    id: "app",
    displayCurrency: "NGN",
    fxToNgn: { NGN: 1, USD: 1500, GBP: 1900 },
    defaultLeadDays: 2,
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  subscriptions: [
    {
      id: "old-netflix",
      name: "Netflix",
      serviceId: "netflix",
      category: "streaming",
      amount: 4400,
      currency: "NGN",
      cycle: { unit: "month", interval: 1 },
      nextRenewal: "2026-01-31",
      leadDays: 2,
      isTrial: false,
      cancelUrl: "https://www.netflix.com/cancelplan",
      notes: null,
      status: "active",
      createdAt: "2025-12-01T00:00:00.000Z",
      updatedAt: "2025-12-01T00:00:00.000Z",
    },
  ],
};

describe("parseBackup", () => {
  it("accepts a v1 backup and fills v2 defaults", () => {
    const backup = parseBackup(JSON.stringify(v1Backup));
    expect(backup.version).toBe(BACKUP_VERSION);
    expect(backup.settings.notificationTime).toBe("08:00");
    expect(backup.subscriptions[0]?.billingDay).toBe(31);
    expect(backup.subscriptions[0]?.paidVia).toBe("card");
    expect(backup.subscriptions[0]?.chargeStatus).toBe("unknown");
    expect(backup.subscriptions[0]?.myShare).toBeNull();
    expect(backup.subscriptions[0]?.priceHistory).toEqual([]);
  });

  it("rejects invalid files", () => {
    expect(() => parseBackup("not json")).toThrow(/valid JSON/);
    expect(() => parseBackup(JSON.stringify({ app: "other" }))).toThrow(
      /valid Undue backup/,
    );
  });
});
