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

export function advance(date: Date, cycle: Cycle): Date {
  switch (cycle.unit) {
    case "day":
      return addDays(date, cycle.interval);
    case "week":
      return addDays(date, cycle.interval * 7);
    case "month":
      return addMonths(date, cycle.interval);
    case "year":
      return addMonths(date, cycle.interval * 12);
  }
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
