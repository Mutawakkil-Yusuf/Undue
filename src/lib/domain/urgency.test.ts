import { describe, expect, it } from "vitest";
import { compareUrgency, urgencyBucket, type UrgencyLevel } from "./urgency";

describe("urgencyBucket", () => {
  it("puts things that need action now in the now bucket", () => {
    expect(urgencyBucket("missed")).toBe("now");
    expect(urgencyBucket("today")).toBe("now");
    expect(urgencyBucket("urgent")).toBe("now");
    expect(urgencyBucket("past")).toBe("now");
  });

  it("puts the coming week in the week bucket", () => {
    expect(urgencyBucket("soon")).toBe("week");
  });

  it("puts everything else in the later bucket", () => {
    expect(urgencyBucket("safe")).toBe("later");
  });
});

describe("compareUrgency", () => {
  it("orders more urgent levels first", () => {
    const levels: UrgencyLevel[] = ["safe", "missed", "soon", "today", "urgent", "past"];
    const sorted = [...levels].sort(compareUrgency);
    expect(sorted).toEqual(["missed", "today", "urgent", "soon", "safe", "past"]);
  });
});
