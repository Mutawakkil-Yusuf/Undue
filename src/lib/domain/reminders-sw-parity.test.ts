import { readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
import { describe, expect, it } from "vitest";
import { selectReminders, toNotification } from "./reminders";
import type { Subscription } from "./schema";

interface SwReminders {
  selectReminders: (subs: unknown[], clock: Date) => unknown[];
  toNotification: (reminders: unknown[]) => unknown;
}

function loadServiceWorker(): SwReminders {
  const source = readFileSync(join(process.cwd(), "public/sw.js"), "utf8");
  const self: Record<string, unknown> = {
    addEventListener: () => undefined,
    location: { origin: "https://undue.test" },
  };
  vm.runInNewContext(
    source,
    { self, Intl, Date, URL, Request, Response },
    { filename: "sw.js" },
  );
  return self.__undueReminders as SwReminders;
}

function make(overrides: Partial<Subscription>): Subscription {
  return {
    id: "s",
    name: "Netflix",
    serviceId: null,
    category: "streaming",
    amount: 1000,
    currency: "NGN",
    cycle: { unit: "month", interval: 1 },
    nextRenewal: "2026-11-10",
    leadDays: 2,
    isTrial: false,
    cancelUrl: null,
    notes: null,
    priceHistory: [],
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as Subscription;
}

const CLOCK = new Date(2026, 10, 8, 10, 0, 0); // 8 Nov 2026, 10:00 local

describe("service worker reminder parity", () => {
  const sw = loadServiceWorker();

  const subscriptions: Subscription[] = [
    make({ id: "today", name: "Spotify", nextRenewal: "2026-11-10" }), // cancel-by today
    make({ id: "urgent", name: "DStv", nextRenewal: "2026-11-11" }), // 1 day left
    make({ id: "soon-plain", name: "Plain", nextRenewal: "2026-11-14" }), // soon, no trial: quiet
    make({ id: "soon-trial", name: "Trialy", nextRenewal: "2026-11-14", isTrial: true }),
    make({ id: "trial-today", name: "Hulu", nextRenewal: "2026-11-10", isTrial: true }),
    make({ id: "missed", name: "Gym", nextRenewal: "2026-11-09" }),
    make({ id: "past", name: "Old", nextRenewal: "2026-11-01" }),
    make({ id: "safe", name: "Far", nextRenewal: "2026-12-30" }),
    make({
      id: "cancelled",
      name: "Gone",
      nextRenewal: "2026-11-10",
      status: "cancelled",
    }),
  ];

  it("selects exactly the same reminders, with identical wording", () => {
    const fromTs = selectReminders(subscriptions, CLOCK);
    const fromSw = sw.selectReminders(subscriptions, CLOCK);
    expect(fromSw).toEqual(fromTs);
    expect(fromTs.map((reminder) => reminder.subscriptionId)).toEqual([
      "today",
      "urgent",
      "soon-trial",
      "trial-today",
      "missed",
    ]);
  });

  it("builds the same notification for one and for many reminders", () => {
    const all = selectReminders(subscriptions, CLOCK);
    expect(sw.toNotification(all)).toEqual(toNotification(all));
    expect(sw.toNotification(all.slice(0, 1))).toEqual(toNotification(all.slice(0, 1)));
    expect(sw.toNotification([])).toBeNull();
  });
});
