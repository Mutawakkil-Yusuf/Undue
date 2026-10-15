import { parseIsoDate } from "./date";

const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getDateFormatter(locale: string): Intl.DateTimeFormat {
  const cached = dateFormatterCache.get(locale);
  if (cached) {
    return cached;
  }
  const formatter = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  dateFormatterCache.set(locale, formatter);
  return formatter;
}

export function formatDate(iso: string, locale = "en-GB"): string {
  return getDateFormatter(locale).format(parseIsoDate(iso));
}

export function formatDaysUntil(days: number): string {
  if (days === 0) {
    return "today";
  }
  if (days === 1) {
    return "tomorrow";
  }
  if (days === -1) {
    return "yesterday";
  }
  if (days > 1) {
    return `in ${days} days`;
  }
  return `${Math.abs(days)} days ago`;
}

export function formatCountdown(days: number): string {
  if (days === 0) {
    return "Today";
  }
  if (days === 1) {
    return "1 day";
  }
  if (days > 1) {
    return `${days} days`;
  }
  return `${Math.abs(days)}d ago`;
}
