import Papa from "papaparse";
import { searchCatalog } from "@/lib/catalog";
import { advanceToFuture } from "@/lib/domain/cycle";
import { formatIsoDate, parseIsoDate } from "@/lib/domain/date";
import type { CategoryId, CurrencyCode, Cycle } from "@/lib/domain/schema";
import { parseDateToken } from "@/lib/import/quick-entry";
import type { Subscription } from "@/lib/domain/schema";

export type DetectionConfidence = "high" | "medium" | "low";

export interface DetectedSubscription {
  readonly key: string;
  readonly name: string;
  readonly amount: number;
  readonly currency: CurrencyCode;
  readonly nextRenewal: string;
  readonly billingDay: number;
  readonly cycle: Cycle;
  readonly leadDays: number;
  readonly category: CategoryId;
  readonly serviceId: string | null;
  readonly cancelUrl: string | null;
  readonly notes: string;
  readonly confidence: DetectionConfidence;
  readonly occurrences: number;
  readonly lastDate: string;
  readonly alreadyTracked: boolean;
}

export interface BankCsvDetection {
  readonly entries: DetectedSubscription[];
  readonly transactions: number;
  readonly skipped: number;
}

interface TransactionRow {
  date: string;
  description: string;
  amount: number;
  currency: CurrencyCode;
}

interface NormalizedMerchant {
  key: string;
  display: string;
}

const NOISE_WORDS =
  /\b(?:pos|web|ussd|nip|transfer|debit|purchase|payment|ref|reference|card|trx|txn|ptn|acct|account|ending|bal|available|to|from|by|the|inc|llc|ltd|limited|plc|gmbh|corp|company|ab|as)\b/gi;
const CARD_REF =
  /\b(?:card|acct|account|ref|reference|trx|txn)\s*(?:ending|no\.?|number)?\s*\d{2,}\b/gi;
const LONG_DIGITS = /\b\d{4,}[A-Za-z0-9-]*\b/g;
const ISO_DATE = /\b\d{4}-\d{2}-\d{2}\b/g;
const NUMERIC_DATE = /\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/g;
const NAMED_DATE =
  /\b(?:\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep(?:t)?|oct|nov|dec)[a-z]*\s+\d{2,4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep(?:t)?|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{2,4})\b/gi;
const DOMAIN_SUFFIX = /\.(?:com|ng|net|org|io|co|app|tv)\b/gi;

function collapse(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function titleCase(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 5)
    .map((word) => {
      if (/^[A-Z0-9]{2,4}$/.test(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function normalizeMerchant(raw: string): NormalizedMerchant {
  let value = raw.toLowerCase();
  value = value
    .replace(ISO_DATE, " ")
    .replace(NUMERIC_DATE, " ")
    .replace(NAMED_DATE, " ");
  value = value.replace(CARD_REF, " ");
  value = value.replace(LONG_DIGITS, " ");
  value = value.replace(NOISE_WORDS, " ");
  value = value.replace(DOMAIN_SUFFIX, " ");
  value = value.replace(/[^a-z0-9 .&+'-]/g, " ");
  value = collapse(value);
  if (!value) {
    return { key: "", display: "Imported subscription" };
  }

  // Keep the part that is most likely the brand, not the bank's wrapping.
  const words = value.split(" ").filter((word) => word.length > 1 && !/^\d+$/.test(word));
  const core = words.slice(0, 4).join(" ");
  return { key: core.replace(/[^a-z0-9]/g, "-"), display: titleCase(core) };
}

function detectCurrency(value: string): CurrencyCode {
  const upper = value.toUpperCase();
  if (upper.includes("GBP") || value.includes("£")) return "GBP";
  if (upper.includes("USD") || value.includes("$")) return "USD";
  if (upper.includes("EUR") || value.includes("€")) return "EUR";
  if (upper.includes("CAD") || value.includes("C$")) return "CAD";
  if (upper.includes("AUD") || value.includes("A$")) return "AUD";
  if (upper.includes("ZAR") || value.includes("R")) return "ZAR";
  if (upper.includes("INR") || value.includes("₹")) return "INR";
  if (upper.includes("JPY") || value.includes("¥")) return "JPY";
  if (upper.includes("CNY")) return "CNY";
  return "NGN";
}

/** Parse a signed number from a bank cell; parentheses mean negative. */
function parseSigned(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const negative = /^-|^\(|\)$/.test(trimmed);
  const cleaned = trimmed.replace(/[,()\s]/g, "");
  const amount = Number.parseFloat(cleaned);
  if (!Number.isFinite(amount)) {
    return null;
  }
  return negative ? -Math.abs(amount) : amount;
}

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findHeader(headers: string[], ...aliases: string[]): number {
  return headers.findIndex((header) => aliases.includes(header));
}

function parseRows(text: string, now: Date): TransactionRow[] {
  const parsed = Papa.parse<Record<string, string | undefined>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
    transform: (value) => value.trim(),
  });
  const headers = parsed.meta.fields ?? [];
  if (headers.length === 0) {
    return [];
  }

  const dateIndex = findHeader(
    headers,
    "date",
    "posteddate",
    "transactiondate",
    "valuedate",
    "operationdate",
  );
  const descriptionIndex = findHeader(
    headers,
    "description",
    "details",
    "narration",
    "merchant",
    "memo",
    "activity",
    "remark",
    "reference",
  );
  const amountIndex = findHeader(
    headers,
    "amount",
    "value",
    "charge",
    "debit",
    "debitamount",
    "withdrawal",
    "withdrawalamount",
    "paymentamount",
  );
  const creditIndex = findHeader(
    headers,
    "credit",
    "creditamount",
    "deposit",
    "depositamount",
    "in",
  );
  const directionIndex = findHeader(
    headers,
    "type",
    "transactiontype",
    "direction",
    "category",
    "movement",
  );
  if (dateIndex < 0 || amountIndex < 0) {
    return [];
  }

  const rows: TransactionRow[] = [];
  for (const row of parsed.data) {
    const values = headers.map((header) => row[header] ?? "");
    const rawDate = (values[dateIndex] ?? "").trim();
    const description = (values[descriptionIndex] ?? "").trim();
    const amountRaw = values[amountIndex] ?? "";
    const creditRaw = creditIndex >= 0 ? (values[creditIndex] ?? "") : "";
    const direction = (directionIndex >= 0 ? (values[directionIndex] ?? "") : "")
      .toLowerCase()
      .replace(/[^a-z]/g, "");
    const isDeposit = /credit|deposit|refund|cashin|paymentin|interest|transferin/.test(
      direction,
    );

    const iso = parseDateToken(rawDate, now);
    if (!iso) {
      continue;
    }

    if (isDeposit) {
      continue;
    }

    let expense: number | null = null;
    const debit = parseSigned(amountRaw);
    const credit = creditIndex >= 0 ? parseSigned(creditRaw) : null;

    if (credit !== null && credit > 0) {
      // A row with money in is not a subscription charge.
      continue;
    }
    if (debit !== null) {
      // A debit column is an outbound charge (positive or negative signed).
      // A separate credit column has already been skipped above if it is set.
      expense = Math.abs(debit);
    }

    if (expense === null || !Number.isFinite(expense) || expense <= 0) {
      continue;
    }

    rows.push({
      date: iso,
      description: description || "Imported subscription",
      amount: Math.round(expense * 100) / 100,
      currency: detectCurrency(`${rawDate} ${description} ${amountRaw}`),
    });
  }
  return rows;
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const lower = sorted[mid - 1] ?? sorted[0] ?? 0;
  const upper = sorted[mid] ?? lower;
  return sorted.length % 2 === 0 ? (lower + upper) / 2 : upper;
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

interface CycleMatch {
  cycle: Cycle;
  toleranceDays: number;
}

function detectCycle(diffs: number[]): CycleMatch | null {
  const matches = (min: number, max: number) =>
    diffs.every((diff) => diff >= min && diff <= max);

  // Prefer the tighter / more common cadences first.
  if (matches(24, 37)) return { cycle: { unit: "month", interval: 1 }, toleranceDays: 6 };
  if (matches(5, 9)) return { cycle: { unit: "week", interval: 1 }, toleranceDays: 2 };
  if (matches(78, 105))
    return { cycle: { unit: "month", interval: 3 }, toleranceDays: 12 };
  if (matches(330, 410))
    return { cycle: { unit: "year", interval: 1 }, toleranceDays: 25 };
  return null;
}

function confidenceOf(
  diffs: number[],
  tolerance: number,
  count: number,
): DetectionConfidence {
  const dev =
    diffs.length > 0
      ? Math.max(...diffs.map((diff) => Math.abs(diff - median(diffs))))
      : 0;
  if (count >= 3 && dev <= Math.max(3, tolerance / 2)) {
    return "high";
  }
  if (count >= 2) {
    return "medium";
  }
  return "low";
}

function clusterTransactions(items: TransactionRow[]): TransactionRow[][] {
  const sorted = [...items].sort((a, b) => a.amount - b.amount);
  const clusters: TransactionRow[][] = [];
  let current: TransactionRow[] = [];
  let running = 0;
  for (const item of sorted) {
    if (current.length === 0) {
      current.push(item);
      running = item.amount;
      continue;
    }
    const average = running / current.length;
    if (Math.abs(item.amount - average) <= Math.max(2, average * 0.07)) {
      current.push(item);
      running += item.amount;
    } else {
      clusters.push(current);
      current = [item];
      running = item.amount;
    }
  }
  if (current.length > 0) {
    clusters.push(current);
  }
  return clusters;
}

function matchesExisting(
  entry: Pick<DetectedSubscription, "serviceId" | "amount" | "currency" | "name">,
  existing: readonly Subscription[] | undefined,
): boolean {
  if (!existing) {
    return false;
  }
  const normalized = entry.name.toLowerCase().replace(/[^a-z0-9]/g, "");
  return existing.some((subscription) => {
    if (
      entry.serviceId &&
      subscription.serviceId &&
      entry.serviceId === subscription.serviceId
    ) {
      return true;
    }
    const other = subscription.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    return (
      other === normalized &&
      subscription.currency === entry.currency &&
      Math.abs(subscription.amount - entry.amount) / Math.max(1, entry.amount) <= 0.1
    );
  });
}

/**
 * Detect recurring debits in a pasted/uploaded bank CSV. Everything runs on
 * the device; the file never leaves it.
 */
export function detectRecurringCharges(
  text: string,
  options: { now?: Date; existing?: readonly Subscription[] } = {},
): BankCsvDetection {
  const now = options.now ?? new Date();
  const rows = parseRows(text, now);
  if (rows.length === 0) {
    return { entries: [], transactions: 0, skipped: 0 };
  }

  const byMerchant = new Map<string, TransactionRow[]>();
  for (const row of rows) {
    const { key } = normalizeMerchant(row.description);
    if (!key) {
      continue;
    }
    const id = `${key}::${row.currency}`;
    const list = byMerchant.get(id) ?? [];
    list.push(row);
    byMerchant.set(id, list);
  }

  const entries: DetectedSubscription[] = [];
  let skipped = 0;

  for (const [id, list] of byMerchant) {
    for (const cluster of clusterTransactions(list)) {
      if (cluster.length < 2) {
        skipped += 1;
        continue;
      }
      const sorted = [...cluster].sort(
        (a, b) => parseIsoDate(a.date).getTime() - parseIsoDate(b.date).getTime(),
      );
      const diffs: number[] = [];
      for (let index = 1; index < sorted.length; index += 1) {
        diffs.push(
          Math.round(
            (parseIsoDate(sorted[index]!.date).getTime() -
              parseIsoDate(sorted[index - 1]!.date).getTime()) /
              86_400_000,
          ),
        );
      }
      const cycleMatch = detectCycle(diffs);
      if (!cycleMatch) {
        skipped += 1;
        continue;
      }

      const avgAmount = Math.round(mean(sorted.map((item) => item.amount)) * 100) / 100;
      const latest = sorted[sorted.length - 1]!;
      const billingDay = parseIsoDate(latest.date).getUTCDate();
      const catalogHit = searchCatalog(latest.description, 1)[0];
      const { display } = normalizeMerchant(latest.description);
      const name = catalogHit?.name ?? display;
      const nextRenewal = formatIsoDate(
        advanceToFuture(parseIsoDate(latest.date), cycleMatch.cycle, now, billingDay),
      );
      const entryBase = {
        key: `${id}-${sorted[0]!.date}-${Math.round(avgAmount)}`,
        name,
        amount: avgAmount,
        currency: latest.currency,
        nextRenewal,
        billingDay,
        cycle: cycleMatch.cycle,
        leadDays: catalogHit?.defaultLeadDays ?? 2,
        category: catalogHit?.category ?? ("other" as CategoryId),
        serviceId: catalogHit?.id ?? null,
        cancelUrl: catalogHit?.cancelUrl ?? null,
        notes: `Detected from bank CSV (${sorted.length} matching charges).`,
        confidence: confidenceOf(diffs, cycleMatch.toleranceDays, sorted.length),
        occurrences: sorted.length,
        lastDate: latest.date,
      };
      entries.push({
        ...entryBase,
        alreadyTracked: matchesExisting(entryBase, options.existing),
      });
    }
  }

  entries.sort((a, b) => {
    const order: Record<DetectionConfidence, number> = { high: 0, medium: 1, low: 2 };
    return order[a.confidence] - order[b.confidence] || b.amount - a.amount;
  });

  return { entries, transactions: rows.length, skipped };
}
