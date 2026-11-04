import { searchCatalog } from "@/lib/catalog";
import { advanceToFuture } from "@/lib/domain/cycle";
import { addMonths, formatIsoDate, parseIsoDate } from "@/lib/domain/date";
import {
  CATEGORIES,
  type CategoryId,
  type CurrencyCode,
  type Cycle,
} from "@/lib/domain/schema";

export interface ParsedQuickEntry {
  key: string;
  name: string;
  amount: number;
  currency: CurrencyCode;
  nextRenewal: string;
  billingDay: number;
  cycle: Cycle;
  leadDays: number;
  category: CategoryId;
  serviceId: string | null;
  cancelUrl: string | null;
  notes: string | null;
}

const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  sept: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function clean(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function stripNonAmountNumbers(value: string): string {
  return value
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, " ")
    .replace(/\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/g, " ")
    .replace(
      /\b\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep(?:t)?|oct|nov|dec)[a-z]*\s+\d{2,4}\b/gi,
      " ",
    )
    .replace(
      /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep(?:t)?|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{2,4}\b/gi,
      " ",
    )
    .replace(
      /\b(?:card|acct|account|ref|reference)\s*(?:ending|no\.?|number)?\s*\d{2,}\b/gi,
      " ",
    );
}

function parseAmount(value: string): number | null {
  const cleaned = stripNonAmountNumbers(value);
  const currencyMatch = /(?:NGN|USD|GBP|₦|\$|£)\s*([\d][\d,]*(?:\.\d{1,2})?)/i.exec(
    cleaned,
  );
  const plainMatch = /([\d][\d,]*(?:\.\d{1,2})?)/.exec(cleaned);
  const raw = currencyMatch?.[1] ?? plainMatch?.[1];
  if (!raw) {
    return null;
  }
  const amount = Number.parseFloat(raw.replace(/,/g, ""));
  return Number.isFinite(amount) ? Math.abs(amount) : null;
}

function parseCurrency(value: string): CurrencyCode {
  const upper = value.toUpperCase();
  if (upper.includes("GBP") || value.includes("£")) {
    return "GBP";
  }
  if (upper.includes("USD") || value.includes("$")) {
    return "USD";
  }
  return "NGN";
}

export function parseDateToken(value: string, now: Date): string | null {
  const iso = /(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (iso) {
    return validatedIso(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }

  const numeric = /(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/.exec(value);
  if (numeric) {
    const first = Number(numeric[1]);
    const second = Number(numeric[2]);
    let year = Number(numeric[3]);
    if (year < 100) {
      year += 2000;
    }
    // Nigerian bank alerts are usually day/month/year. Only fall back to
    // month/day/year when the second value cannot be a month.
    const day = second > 12 ? second : first;
    const month = second > 12 ? first : second;
    return validatedIso(year, month, day);
  }

  const named = /(\d{1,2})\s+([A-Za-z]{3,9})[a-z]*\s+(\d{2,4})/.exec(value);
  if (named) {
    const month = MONTHS[(named[2] ?? "").slice(0, 3).toLowerCase()];
    if (month !== undefined) {
      let year = Number(named[3]);
      if (year < 100) {
        year += 2000;
      }
      return validatedIso(year, month + 1, Number(named[1]));
    }
  }

  const namedFirst = /([A-Za-z]{3,9})[a-z]*\s+(\d{1,2}),?\s+(\d{2,4})/.exec(value);
  if (namedFirst) {
    const month = MONTHS[(namedFirst[1] ?? "").slice(0, 3).toLowerCase()];
    if (month !== undefined) {
      let year = Number(namedFirst[3]);
      if (year < 100) {
        year += 2000;
      }
      return validatedIso(year, month + 1, Number(namedFirst[2]));
    }
  }

  // Some statements only include day/month; assume the current year.
  const shortDate = /(\d{1,2})[/-](\d{1,2})(?![/-]\d)/.exec(value);
  if (shortDate) {
    return validatedIso(now.getUTCFullYear(), Number(shortDate[2]), Number(shortDate[1]));
  }

  return null;
}

function validatedIso(year: number, month: number, day: number): string | null {
  const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  try {
    parseIsoDate(iso);
    return iso;
  } catch {
    return null;
  }
}

function inferCycle(value: string): Cycle {
  const lower = value.toLowerCase();
  if (/\b(daily|day)\b/.test(lower)) {
    return { unit: "day", interval: 1 };
  }
  if (/\b(weekly|week)\b/.test(lower)) {
    return { unit: "week", interval: 1 };
  }
  if (/\b(quarterly|quarter)\b/.test(lower)) {
    return { unit: "month", interval: 3 };
  }
  if (/\b(annual|annually|yearly|year)\b/.test(lower)) {
    return { unit: "year", interval: 1 };
  }
  return { unit: "month", interval: 1 };
}

function inferCategory(value: string): CategoryId {
  const lower = value.toLowerCase();
  const match = CATEGORIES.find(
    (category) =>
      lower.includes(category.label.toLowerCase()) ||
      lower.includes(category.id.replace("-", " ")),
  );
  return match?.id ?? "other";
}

function inferName(value: string): string {
  const cleaned = value
    .replace(
      /\b(?:debit|credit|alert|transaction|purchase|pos|web|transfer|payment|paid|from|to|via|card|ending|acct|account|ref|reference|date|amount|ngn|usd|gbp)\b/gi,
      " ",
    )
    .replace(/[₦$£]/g, " ")
    .replace(/\bwww\b/gi, " ")
    .replace(/\.(?:com|ng|net|org|io|co|app|tv)\b/gi, " ")
    .replace(/\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/g, " ")
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, " ")
    .replace(
      /\b\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep(?:t)?|oct|nov|dec)[a-z]*\s+\d{2,4}\b/gi,
      " ",
    )
    .replace(/\b\d[\d,]*(?:\.\d+)?\b/g, " ")
    .replace(/[^A-Za-z0-9 .&+'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "Imported subscription";
  }
  return cleaned
    .split(" ")
    .filter(Boolean)
    .slice(0, 4)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function futureRenewal(
  iso: string | null,
  cycle: Cycle,
  now: Date,
  billingDay: number,
): string {
  if (!iso) {
    return formatIsoDate(addMonths(now, 1));
  }
  try {
    const parsed = parseIsoDate(iso);
    return formatIsoDate(advanceToFuture(parsed, cycle, now, billingDay));
  } catch {
    return formatIsoDate(addMonths(now, 1));
  }
}

function toEntry(
  raw: {
    name: string;
    amount: number;
    currency?: CurrencyCode | undefined;
    date?: string | null | undefined;
    cycle?: Cycle | undefined;
    leadDays?: number | undefined;
    category?: CategoryId | undefined;
    notes?: string | undefined;
  },
  index: number,
  now: Date,
): ParsedQuickEntry | null {
  const name = clean(raw.name);
  if (!name || !Number.isFinite(raw.amount) || raw.amount <= 0) {
    return null;
  }
  const catalog = searchCatalog(name, 1)[0];
  const cycle = raw.cycle ?? catalog?.defaultCycle ?? inferCycle(name);
  const currency = raw.currency ?? parseCurrency(name);
  const category = raw.category ?? catalog?.category ?? inferCategory(name);

  // Keep the original charge day as the month-end anchor (Jan 31 -> Feb 28 ->
  // Mar 31), even when the alert date is in the past and gets rolled forward.
  let billingDay = 1;
  try {
    billingDay = parseIsoDate(raw.date ?? formatIsoDate(addMonths(now, 1))).getUTCDate();
  } catch {
    try {
      billingDay = parseIsoDate(formatIsoDate(addMonths(now, 1))).getUTCDate();
    } catch {
      billingDay = 1;
    }
  }
  const nextRenewal = futureRenewal(raw.date ?? null, cycle, now, billingDay);

  return {
    key: `quick-${index}-${name.toLowerCase().replace(/\W+/g, "-")}`,
    name,
    amount: raw.amount,
    currency,
    nextRenewal,
    billingDay,
    cycle,
    leadDays: raw.leadDays ?? catalog?.defaultLeadDays ?? 2,
    category,
    serviceId: catalog?.id ?? null,
    cancelUrl: catalog?.cancelUrl ?? null,
    notes: raw.notes?.trim() || null,
  };
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      fields.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCsv(text: string, now: Date): ParsedQuickEntry[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0] ?? "").map((header) =>
    header.toLowerCase().replace(/[^a-z0-9]/g, ""),
  );
  const find = (...names: string[]) =>
    headers.findIndex((header) => names.includes(header));
  const nameIndex = find("name", "description", "merchant", "details", "narration");
  const amountIndex = find("amount", "debit", "value", "charge");
  const dateIndex = find("nextrenewal", "date", "transactiondate", "chargedate");
  const currencyIndex = find("currency", "ccy");
  const cycleIndex = find("cycle", "frequency", "interval");
  const leadIndex = find("leaddays", "reminder", "reminderdays");
  const categoryIndex = find("category");

  if (nameIndex < 0 || amountIndex < 0) {
    return [];
  }

  const entries: ParsedQuickEntry[] = [];
  lines.slice(1).forEach((line, rowIndex) => {
    const fields = parseCsvLine(line);
    const name = fields[nameIndex] ?? "";
    const amount = parseAmount(fields[amountIndex] ?? "");
    if (!name || amount === null) {
      return;
    }
    const rawDate = dateIndex >= 0 ? fields[dateIndex] : "";
    const entry = toEntry(
      {
        name,
        amount,
        currency:
          currencyIndex >= 0 ? parseCurrency(fields[currencyIndex] ?? "") : undefined,
        date: rawDate ? parseDateToken(rawDate, now) : null,
        cycle: cycleIndex >= 0 ? inferCycle(fields[cycleIndex] ?? "") : undefined,
        leadDays:
          leadIndex >= 0 && Number.isFinite(Number(fields[leadIndex]))
            ? Math.min(60, Math.max(0, Math.trunc(Number(fields[leadIndex]))))
            : undefined,
        category:
          categoryIndex >= 0 ? inferCategory(fields[categoryIndex] ?? "") : undefined,
        notes: line,
      },
      rowIndex,
      now,
    );
    if (entry) {
      entries.push(entry);
    }
  });
  return entries;
}

/**
 * Parse pasted bank alerts, SMS messages, or a small CSV export. It deliberately
 * stays conservative: rows without a name and a positive amount are skipped.
 */
export function parseQuickEntries(
  text: string,
  now: Date = new Date(),
): ParsedQuickEntry[] {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }

  const csv = parseCsv(trimmed, now);
  if (csv.length > 0) {
    return csv;
  }

  const entries: ParsedQuickEntry[] = [];
  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  lines.forEach((line, index) => {
    const amount = parseAmount(line);
    if (amount === null || amount <= 0) {
      return;
    }
    const date = parseDateToken(line, now);
    const name = inferName(line);
    const entry = toEntry(
      {
        name,
        amount,
        currency: parseCurrency(line),
        date,
        cycle: inferCycle(line),
        notes: line,
      },
      index,
      now,
    );
    if (entry) {
      entries.push(entry);
    }
  });

  return entries;
}
