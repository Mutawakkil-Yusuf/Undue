const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MILLISECONDS_PER_DAY = 86_400_000;

export function parseIsoDate(value: string): Date {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) {
    throw new RangeError(`Invalid ISO date: ${value}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new RangeError(`Invalid calendar date: ${value}`);
  }

  return date;
}

export function formatIsoDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function civilDate(clock: Date = new Date()): Date {
  return new Date(Date.UTC(clock.getFullYear(), clock.getMonth(), clock.getDate()));
}

export function todayIso(clock: Date = new Date()): string {
  return formatIsoDate(civilDate(clock));
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MILLISECONDS_PER_DAY);
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/**
 * Add calendar months while optionally preserving a billing-day anchor.
 *
 * Without an anchor, Jan 31 -> Feb 28 -> Mar 28 (the classic drift bug).
 * With an anchor of 31, Jan 31 -> Feb 28 -> Mar 31, so a subscription billed
 * on the 31st returns to the 31st whenever the month allows it.
 */
export function addMonths(date: Date, months: number, anchorDay?: number): Date {
  const targetMonthIndex = date.getUTCMonth() + months;
  const targetYear = date.getUTCFullYear() + Math.floor(targetMonthIndex / 12);
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;

  const lastDayOfTargetMonth = daysInMonth(targetYear, normalizedMonth);
  const day = anchorDay ?? date.getUTCDate();
  const clampedDay = Math.min(Math.max(1, Math.trunc(day)), lastDayOfTargetMonth);

  return new Date(Date.UTC(targetYear, normalizedMonth, clampedDay));
}

export function diffInDays(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / MILLISECONDS_PER_DAY);
}
