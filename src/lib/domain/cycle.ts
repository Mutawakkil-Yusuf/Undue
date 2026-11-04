import type { Cycle, CycleUnit } from "./schema";
import { addDays, addMonths } from "./date";

const UNIT_LABELS: Record<CycleUnit, string> = {
  day: "day",
  week: "week",
  month: "month",
  year: "year",
};

const UNIT_MONTHS: Record<CycleUnit, number> = {
  day: 1 / 30.4375,
  week: 7 / 30.4375,
  month: 1,
  year: 12,
};

export function cycleUnitLabel(unit: CycleUnit): string {
  return UNIT_LABELS[unit];
}

export function advance(date: Date, cycle: Cycle, billingDay?: number): Date {
  switch (cycle.unit) {
    case "day":
      return addDays(date, cycle.interval);
    case "week":
      return addDays(date, cycle.interval * 7);
    case "month":
      return addMonths(date, cycle.interval, billingDay);
    case "year":
      return addMonths(date, cycle.interval * 12, billingDay);
  }
}

/**
 * Roll an old renewal date forward until it is on or after `reference`.
 *
 * This keeps an active subscription useful after the user has been away for a
 * while, instead of making them tap "It renewed" once per missed cycle.
 */
export function advanceToFuture(
  date: Date,
  cycle: Cycle,
  reference: Date,
  billingDay?: number,
): Date {
  if (date.getTime() >= reference.getTime()) {
    return date;
  }

  let occurrence = date;

  // Jump most of the way for day/week cycles so a very old renewal does not
  // need thousands of loop iterations.
  if (cycle.unit === "day" || cycle.unit === "week") {
    const intervalDays = cycle.interval * (cycle.unit === "week" ? 7 : 1);
    const elapsedDays = Math.floor(
      (reference.getTime() - occurrence.getTime()) / 86_400_000,
    );
    const jumps = Math.max(0, Math.floor(elapsedDays / intervalDays));
    occurrence = addDays(occurrence, jumps * intervalDays);
    while (occurrence.getTime() < reference.getTime()) {
      occurrence = addDays(occurrence, intervalDays);
    }
    return occurrence;
  }

  // Month/year cycles are anchored to a day of the month, so jump by whole
  // cycles and then let the normal clamp/anchor logic finish the job.
  const intervalMonths = cycle.unit === "month" ? cycle.interval : cycle.interval * 12;
  const elapsedMonths =
    (reference.getUTCFullYear() - occurrence.getUTCFullYear()) * 12 +
    (reference.getUTCMonth() - occurrence.getUTCMonth());
  const jumps = Math.max(0, Math.floor(elapsedMonths / intervalMonths));
  occurrence = addMonths(occurrence, jumps * intervalMonths, billingDay);

  let guard = 0;
  while (occurrence.getTime() < reference.getTime() && guard < 1000) {
    occurrence = advance(occurrence, cycle, billingDay);
    guard += 1;
  }
  return occurrence;
}

export function monthsPerCycle(cycle: Cycle): number {
  return UNIT_MONTHS[cycle.unit] * cycle.interval;
}

export function cycleLabel(cycle: Cycle): string {
  if (cycle.interval === 1) {
    return `Every ${UNIT_LABELS[cycle.unit]}`;
  }
  return `Every ${cycle.interval} ${UNIT_LABELS[cycle.unit]}s`;
}

export function cycleShortLabel(cycle: Cycle): string {
  if (cycle.interval === 1) {
    switch (cycle.unit) {
      case "day":
        return "daily";
      case "week":
        return "weekly";
      case "month":
        return "monthly";
      case "year":
        return "yearly";
    }
  }
  return `every ${cycle.interval} ${UNIT_LABELS[cycle.unit]}s`;
}
