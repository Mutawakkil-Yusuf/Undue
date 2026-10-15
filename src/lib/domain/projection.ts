import { convert, type FxToNgn } from "./currency";
import { advance } from "./cycle";
import { addMonths, parseIsoDate } from "./date";
import type { CategoryId, CurrencyCode, Subscription } from "./schema";

const MAX_OCCURRENCES = 4000;

export interface ProjectedCharge {
  readonly subscriptionId: string;
  readonly name: string;
  readonly category: CategoryId;
  readonly amount: number;
}

export interface ProjectedMonth {
  readonly month: string;
  readonly total: number;
  readonly charges: readonly ProjectedCharge[];
}

export interface ProjectionOptions {
  readonly referenceDate: Date;
  readonly displayCurrency: CurrencyCode;
  readonly fxToNgn: FxToNgn;
  readonly months?: number;
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

interface Bucket {
  total: number;
  charges: ProjectedCharge[];
}

export function projectSpend(
  subscriptions: readonly Subscription[],
  options: ProjectionOptions,
): ProjectedMonth[] {
  const { referenceDate, displayCurrency, fxToNgn } = options;
  const monthCount = options.months ?? 12;

  const start = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1),
  );
  const end = addMonths(start, monthCount);

  const buckets = new Map<string, Bucket>();
  for (let index = 0; index < monthCount; index += 1) {
    buckets.set(monthKey(addMonths(start, index)), { total: 0, charges: [] });
  }

  for (const subscription of subscriptions) {
    if (subscription.status !== "active") {
      continue;
    }

    const amount = convert(
      subscription.amount,
      subscription.currency,
      displayCurrency,
      fxToNgn,
    );

    let occurrence = parseIsoDate(subscription.nextRenewal);
    let iterations = 0;
    while (occurrence.getTime() < start.getTime() && iterations < MAX_OCCURRENCES) {
      occurrence = advance(occurrence, subscription.cycle);
      iterations += 1;
    }

    while (occurrence.getTime() < end.getTime() && iterations < MAX_OCCURRENCES) {
      const bucket = buckets.get(monthKey(occurrence));
      if (bucket) {
        bucket.total += amount;
        bucket.charges.push({
          subscriptionId: subscription.id,
          name: subscription.name,
          category: subscription.category,
          amount,
        });
      }
      occurrence = advance(occurrence, subscription.cycle);
      iterations += 1;
    }
  }

  return [...buckets.entries()].map(([month, bucket]) => ({
    month,
    total: bucket.total,
    charges: bucket.charges,
  }));
}

function formatMonth(month: string, options: Intl.DateTimeFormatOptions): string {
  const [year, monthPart] = month.split("-");
  const date = new Date(Date.UTC(Number(year), Number(monthPart) - 1, 1));
  return new Intl.DateTimeFormat("en-NG", { ...options, timeZone: "UTC" }).format(date);
}

export function projectionMonthLabel(month: string): string {
  return formatMonth(month, { month: "short" });
}

export function projectionMonthFullLabel(month: string): string {
  return formatMonth(month, { month: "long", year: "numeric" });
}
