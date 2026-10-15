import { computeCancelWindow } from "./cancel-by";
import { cycleLabel } from "./cycle";
import { formatMoney } from "./currency";
import { parseIsoDate, todayIso } from "./date";
import { formatDate } from "./format";
import type { Subscription } from "./schema";

const CRLF = "\r\n";
const DEFAULT_HOUR = 9;
const EVENT_MINUTES = 30;

export const CALENDAR_MIME_TYPE = "text/calendar";

export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

export function foldIcsLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) {
    return line;
  }

  const segments: string[] = [];
  let current = "";
  let currentBytes = 0;
  let limit = 75;

  for (const char of line) {
    const charBytes = encoder.encode(char).length;
    if (currentBytes + charBytes > limit) {
      segments.push(current);
      current = "";
      currentBytes = 0;
      limit = 74;
    }
    current += char;
    currentBytes += charBytes;
  }
  segments.push(current);

  return segments.join(`${CRLF} `);
}

function pad(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}

function formatDateParts(date: Date): string {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
}

export function formatIcsDate(date: Date): string {
  return formatDateParts(date);
}

export function formatIcsFloatingDateTime(
  date: Date,
  hour = DEFAULT_HOUR,
  minute = 0,
): string {
  return `${formatDateParts(date)}T${pad(hour)}${pad(minute)}00`;
}

export function formatIcsUtcStamp(date: Date): string {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(
    date.getUTCHours(),
  )}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function buildDescription(subscription: Subscription): string {
  const lines = [
    `Last day to cancel ${subscription.name}.`,
    `Next charge: ${formatDate(subscription.nextRenewal)} (${cycleLabel(subscription.cycle)}).`,
    `Amount: ${formatMoney(subscription.amount, subscription.currency)}.`,
  ];

  if (subscription.notes) {
    lines.push("", subscription.notes);
  }
  if (subscription.cancelUrl) {
    lines.push("", `Cancel at: ${subscription.cancelUrl}`);
  }
  lines.push("", "Created by Undue. Your data never left your device.");

  return lines.join("\n");
}

export function buildReminderEvent(
  subscription: Subscription,
  now: Date = new Date(),
): string {
  const cancelWindow = computeCancelWindow(subscription, now);
  const cancelByDate = parseIsoDate(cancelWindow.cancelBy);
  const summary = `Last day to cancel ${subscription.name}`;
  const description = buildDescription(subscription);

  const lines = [
    "BEGIN:VEVENT",
    `UID:${subscription.id}@undue`,
    `DTSTAMP:${formatIcsUtcStamp(now)}`,
    `DTSTART:${formatIcsFloatingDateTime(cancelByDate)}`,
    `DTEND:${formatIcsFloatingDateTime(cancelByDate, DEFAULT_HOUR, EVENT_MINUTES)}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
  ];

  if (subscription.cancelUrl) {
    lines.push(`URL:${escapeIcsText(subscription.cancelUrl)}`);
  }

  lines.push(
    "BEGIN:VALARM",
    `TRIGGER:-PT0M`,
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcsText(summary)}`,
    "END:VALARM",
    "END:VEVENT",
  );

  return lines.map(foldIcsLine).join(CRLF);
}

export function buildCalendar(
  subscriptions: readonly Subscription[],
  now: Date = new Date(),
): string {
  const events = subscriptions.map((subscription) =>
    buildReminderEvent(subscription, now),
  );

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Undue//Reminders//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Undue reminders",
    ...events,
    "END:VCALENDAR",
  ];

  return `${lines.join(CRLF)}${CRLF}`;
}

export function calendarFilename(now: Date = new Date()): string {
  return `undue-reminders-${todayIso(now)}.ics`;
}
