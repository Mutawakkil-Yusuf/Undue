import { describe, expect, it } from "vitest";
import type { Subscription } from "@/lib/domain/schema";
import {
  buildCardSpecFor,
  buildDeadlineCardSpec,
  buildSavedCardSpec,
  slugify,
} from "./card-spec";

const TODAY = new Date(2026, 10, 2); // 2 Nov 2026, local calendar day

function make(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: "sub-1",
    name: "Netflix",
    serviceId: "netflix",
    category: "streaming",
    amount: 4500,
    currency: "NGN",
    cycle: { unit: "month", interval: 1 },
    nextRenewal: "2026-11-08",
    leadDays: 2,
    isTrial: false,
    cancelUrl: null,
    notes: null,
    priceHistory: [],
    status: "active",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("slugify", () => {
  it("makes file-safe slugs", () => {
    expect(slugify("Amazon Prime Video")).toBe("amazon-prime-video");
    expect(slugify("Disney+")).toBe("disney");
    expect(slugify("???")).toBe("subscription");
  });
});

describe("buildDeadlineCardSpec", () => {
  it("shows the cancel-by date and a countdown, and hides the price by default", () => {
    const spec = buildDeadlineCardSpec(make(), TODAY, { includeAmount: false });
    expect(spec.kind).toBe("deadline");
    expect(spec.title).toBe("Netflix");
    expect(spec.value).toContain("6 Nov");
    expect(spec.valueSub).toBe("4 days left to cancel");
    expect(spec.tone).toBe("yellow");
    expect(spec.detail).toMatch(/^Renews Sun,? 8 Nov$/);
    expect(spec.showsAmount).toBe(false);
    expect(spec.detail).not.toMatch(/₦|NGN/);
    expect(spec.shareText).toContain("undue.netlify.app");
  });

  it("adds the price when asked", () => {
    const spec = buildDeadlineCardSpec(make(), TODAY, { includeAmount: true });
    expect(spec.detail).toMatch(/₦4,500 monthly/);
    expect(spec.showsAmount).toBe(true);
  });

  it("uses urgent styling on the last day", () => {
    const spec = buildDeadlineCardSpec(make({ nextRenewal: "2026-11-04" }), TODAY, {
      includeAmount: false,
    });
    expect(spec.tone).toBe("coral");
    expect(spec.mascot).toBe("alarmed");
    expect(spec.valueSub).toBe("Last day is today");
    expect(spec.pill).toBe("Cancel today");
  });

  it("describes trials as converting to a paid plan", () => {
    const spec = buildDeadlineCardSpec(make({ isTrial: true }), TODAY, {
      includeAmount: false,
    });
    expect(spec.pill).toBe("Free trial");
    expect(spec.detail).toMatch(/^Converts to paid/);
  });

  it("names the file after the service", () => {
    const spec = buildDeadlineCardSpec(make({ name: "Prime Video" }), TODAY, {
      includeAmount: false,
    });
    expect(spec.filename).toBe("undue-prime-video-deadline.png");
  });
});

describe("buildSavedCardSpec", () => {
  it("shows the yearly saving, using the user's share of a split plan", () => {
    const spec = buildSavedCardSpec(
      make({ status: "cancelled", amount: 12000, shareCount: 4 }),
      TODAY,
      { includeAmount: true },
    );
    expect(spec.kind).toBe("saved");
    expect(spec.value).toBe("₦36,000");
    expect(spec.valueSub).toBe("saved every year");
  });

  it("can leave the amount out", () => {
    const spec = buildSavedCardSpec(make({ status: "cancelled" }), TODAY, {
      includeAmount: false,
    });
    expect(spec.value).toBe("One less charge");
    expect(spec.shareText).not.toMatch(/₦/);
  });
});

describe("buildCardSpecFor", () => {
  it("picks the saved card for cancelled plans", () => {
    expect(
      buildCardSpecFor(make({ status: "cancelled" }), TODAY, { includeAmount: false })
        .kind,
    ).toBe("saved");
    expect(buildCardSpecFor(make(), TODAY, { includeAmount: false }).kind).toBe(
      "deadline",
    );
  });
});
