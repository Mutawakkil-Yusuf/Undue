import { advance, advanceToFuture } from "./cycle";
import { addDays, civilDate, diffInDays, parseIsoDate } from "./date";
import { computeCancelWindow, type CancelWindow } from "./cancel-by";
import { priceChange, type PriceChange } from "./price-history";
import type { Subscription } from "./schema";
import { convert, type FxToNgn } from "./currency";
import { monthlyAmount, annualAmount } from "./spend";
import { costOf } from "./decisions";
import { getBillingDay, getEffectiveAmount } from "./subscription";
import { compareUrgency, type UrgencyLevel } from "./urgency";
import type { CategoryId, CurrencyCode, PricePoint } from "./schema";

export interface OverlapGroup {
  readonly category: CategoryId;
  readonly count: number;
  readonly monthly: number;
  readonly annual: number;
  readonly items: readonly {
    readonly id: string;
    readonly name: string;
    readonly monthly: number;
  }[];
}

export interface UpcomingCharge {
  readonly subscriptionId: string;
  readonly name: string;
  /** Amount in display currency. */
  readonly amount: number;
  /** Original charged amount, useful for plan-specific detail. */
  readonly originalAmount: number;
  readonly originalCurrency: CurrencyCode;
  readonly date: string;
}

export interface UpcomingCashNeed {
  readonly amount: number;
  readonly currency: CurrencyCode;
  readonly charges: readonly UpcomingCharge[];
  readonly largest: UpcomingCharge | null;
}

export interface PriceMove {
  readonly subscription: Subscription;
  readonly change: PriceChange;
}

export interface PaymentRisk {
  readonly subscription: Subscription;
  readonly daysUntilCharge: number;
}

export interface StaleUnsurePlan {
  readonly subscription: Subscription;
  readonly monthly: number;
  readonly annual: number;
}

function isActive(subscription: Subscription): boolean {
  return subscription.status === "active";
}

function displayMonthly(
  subscription: Subscription,
  displayCurrency: CurrencyCode,
  fxToNgn: FxToNgn,
): number {
  return monthlyAmount(
    convert(
      getEffectiveAmount(subscription),
      subscription.currency,
      displayCurrency,
      fxToNgn,
    ),
    subscription.cycle,
  );
}

export function findOverlappingGroups(
  subscriptions: readonly Subscription[],
  displayCurrency: CurrencyCode,
  fxToNgn: FxToNgn,
): OverlapGroup[] {
  const groups = new Map<
    CategoryId,
    { items: { id: string; name: string; monthly: number }[]; monthly: number }
  >();

  for (const subscription of subscriptions) {
    if (!isActive(subscription)) {
      continue;
    }
    const monthly = displayMonthly(subscription, displayCurrency, fxToNgn);
    const group = groups.get(subscription.category) ?? { items: [], monthly: 0 };
    group.items.push({ id: subscription.id, name: subscription.name, monthly });
    group.monthly += monthly;
    groups.set(subscription.category, group);
  }

  return [...groups.entries()]
    .filter(([, group]) => group.items.length >= 2)
    .map(([category, group]) => ({
      category,
      count: group.items.length,
      monthly: group.monthly,
      annual: group.monthly * 12,
      items: [...group.items].sort((a, b) => b.monthly - a.monthly),
    }))
    .sort((a, b) => b.monthly - a.monthly);
}

/**
 * Sum every charge due in the next `days` days, including multiple cycles of
 * short-cycle plans. Annual plans contribute only when due inside the window.
 */
export function upcomingCashNeed(
  subscriptions: readonly Subscription[],
  options: {
    readonly now: Date;
    readonly days: number;
    readonly displayCurrency: CurrencyCode;
    readonly fxToNgn: FxToNgn;
  },
): UpcomingCashNeed {
  const { now, days, displayCurrency, fxToNgn } = options;
  const start = civilDate(now);
  const horizon = addDays(start, days);
  const charges: UpcomingCharge[] = [];

  for (const subscription of subscriptions) {
    if (!isActive(subscription)) {
      continue;
    }
    const billingDay =
      subscription.cycle.unit === "month" || subscription.cycle.unit === "year"
        ? getBillingDay(subscription)
        : undefined;

    let occurrence = advanceToFuture(
      parseIsoDate(subscription.nextRenewal),
      subscription.cycle,
      start,
      billingDay,
    );
    let guard = 0;
    while (
      occurrence.getTime() < horizon.getTime() &&
      charges.length < 10_000 &&
      guard < 64
    ) {
      const originalAmount = getEffectiveAmount(subscription);
      const amount = convert(
        originalAmount,
        subscription.currency,
        displayCurrency,
        fxToNgn,
      );
      charges.push({
        subscriptionId: subscription.id,
        name: subscription.name,
        amount,
        originalAmount,
        originalCurrency: subscription.currency,
        date: occurrence.toISOString().slice(0, 10),
      });
      occurrence = advance(occurrence, subscription.cycle, billingDay);
      guard += 1;
    }
  }

  charges.sort((a, b) => a.date.localeCompare(b.date));
  const amount = charges.reduce((sum, charge) => sum + charge.amount, 0);
  const largest =
    charges.length > 0
      ? charges.reduce((max, charge) => (charge.amount > max.amount ? charge : max))
      : null;

  return { amount, currency: displayCurrency, charges, largest };
}

export function detectPriceMoves(subscriptions: readonly Subscription[]): PriceMove[] {
  const moves: PriceMove[] = [];
  for (const subscription of subscriptions) {
    if (!isActive(subscription)) {
      continue;
    }
    const change = priceChange(subscription.priceHistory);
    if (change?.increased) {
      moves.push({ subscription, change });
    }
  }
  return moves.sort((a, b) => {
    const pctA = a.change.pct ?? 0;
    const pctB = b.change.pct ?? 0;
    return pctB - pctA || b.change.delta - a.change.delta;
  });
}

export function detectPaymentRisks(
  subscriptions: readonly Subscription[],
  now: Date = new Date(),
): PaymentRisk[] {
  const start = civilDate(now);
  const risks: PaymentRisk[] = [];

  for (const subscription of subscriptions) {
    if (!isActive(subscription)) {
      continue;
    }
    if (
      subscription.chargeStatus !== "failed" &&
      subscription.chargeStatus !== "declined"
    ) {
      continue;
    }
    const billingDay =
      subscription.cycle.unit === "month" || subscription.cycle.unit === "year"
        ? getBillingDay(subscription)
        : undefined;
    const next = advanceToFuture(
      parseIsoDate(subscription.nextRenewal),
      subscription.cycle,
      start,
      billingDay,
    );
    risks.push({
      subscription,
      daysUntilCharge: Math.round((next.getTime() - start.getTime()) / 86_400_000),
    });
  }

  return risks.sort((a, b) => a.daysUntilCharge - b.daysUntilCharge);
}

export function findStaleUnsurePlans(
  subscriptions: readonly Subscription[],
  options: {
    readonly now: Date;
    readonly olderThanDays: number;
    readonly displayCurrency: CurrencyCode;
    readonly fxToNgn: FxToNgn;
  },
): StaleUnsurePlan[] {
  const { now, olderThanDays, displayCurrency, fxToNgn } = options;
  const threshold = now.getTime() - olderThanDays * 86_400_000;

  return subscriptions
    .filter((subscription) => {
      if (
        !isActive(subscription) ||
        subscription.decision !== "unsure" ||
        !subscription.decisionUpdatedAt
      ) {
        return false;
      }
      const updated = new Date(subscription.decisionUpdatedAt).getTime();
      return Number.isFinite(updated) && updated < threshold;
    })
    .map((subscription) => {
      const monthly = displayMonthly(subscription, displayCurrency, fxToNgn);
      return {
        subscription,
        monthly,
        annual: annualAmount(monthly, { unit: "month", interval: 1 }),
      };
    })
    .sort((a, b) => b.annual - a.annual);
}

/* ---------------------------------------------------------------- */
/* Decision insights: power the reminder card and the Heads up list */
/* ---------------------------------------------------------------- */

/** Days ahead to look for charges that need money in the account. */
export const UPCOMING_CHARGE_DAYS = 7;
/** A price rise stays in the "heads up" list for this many days after it was logged. */
export const PRICE_HIKE_DAYS = 30;
/** A plan tagged "unsure" is brought back for review after this many days. */
export const UNSURE_REVIEW_DAYS = 30;

/** Categories where paying for two plans at once is usually worth a second look. */
export const OVERLAP_CATEGORIES: readonly CategoryId[] = [
  "streaming",
  "music",
  "cloud",
  "gaming",
];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const DECISION_LEVELS: ReadonlySet<UrgencyLevel> = new Set<UrgencyLevel>([
  "missed",
  "today",
  "urgent",
  "soon",
]);

/* 1. Decide at the reminder */
export interface DecisionPrompt {
  readonly subscription: Subscription;
  readonly window: CancelWindow;
  /** True when the user already tagged it "cut", so the prompt is about acting. */
  readonly markedCut: boolean;
}

/**
 * The one plan to ask about right now: the active plan whose cancel window is
 * closest, unless the user already said they are keeping it.
 */
export function pickDecision(
  subscriptions: readonly Subscription[],
  today: Date,
): DecisionPrompt | null {
  let best: { subscription: Subscription; window: CancelWindow } | null = null;

  for (const subscription of subscriptions) {
    if (!isActive(subscription) || subscription.decision === "keep") {
      continue;
    }
    const window = computeCancelWindow(subscription, today);
    if (!DECISION_LEVELS.has(window.urgency)) {
      continue;
    }
    if (
      best === null ||
      compareUrgency(window.urgency, best.window.urgency) < 0 ||
      (window.urgency === best.window.urgency &&
        window.daysUntilCancelBy < best.window.daysUntilCancelBy)
    ) {
      best = { subscription, window };
    }
  }

  return best ? { ...best, markedCut: best.subscription.decision === "cut" } : null;
}

/* 2. Overlapping plans */
export interface Overlap {
  readonly category: CategoryId;
  readonly count: number;
  readonly monthly: number;
  readonly annual: number;
  readonly names: readonly string[];
}

export function findOverlaps(
  subscriptions: readonly Subscription[],
  currency: CurrencyCode,
  fxToNgn: FxToNgn,
): Overlap[] {
  const groups = new Map<CategoryId, { monthly: number; names: string[] }>();

  for (const subscription of subscriptions) {
    if (!isActive(subscription) || !OVERLAP_CATEGORIES.includes(subscription.category)) {
      continue;
    }
    const group = groups.get(subscription.category) ?? { monthly: 0, names: [] };
    group.monthly += costOf(subscription, currency, fxToNgn).monthly;
    group.names.push(subscription.name);
    groups.set(subscription.category, group);
  }

  return [...groups.entries()]
    .filter(([, group]) => group.names.length >= 2)
    .map(([category, group]) => ({
      category,
      count: group.names.length,
      monthly: group.monthly,
      annual: group.monthly * 12,
      names: group.names,
    }))
    .sort((a, b) => b.monthly - a.monthly);
}

/* 3. Money needed soon */
export interface UpcomingCharges {
  readonly total: number;
  readonly items: readonly {
    readonly subscription: Subscription;
    readonly amount: number;
    readonly daysUntil: number;
  }[];
}

export function upcomingCharges(
  subscriptions: readonly Subscription[],
  today: Date,
  currency: CurrencyCode,
  fxToNgn: FxToNgn,
  days: number = UPCOMING_CHARGE_DAYS,
): UpcomingCharges {
  const items: { subscription: Subscription; amount: number; daysUntil: number }[] = [];

  for (const subscription of subscriptions) {
    if (!isActive(subscription)) {
      continue;
    }
    const { daysUntilRenewal } = computeCancelWindow(subscription, today);
    if (daysUntilRenewal < 0 || daysUntilRenewal > days) {
      continue;
    }
    items.push({
      subscription,
      amount: convert(
        getEffectiveAmount(subscription),
        subscription.currency,
        currency,
        fxToNgn,
      ),
      daysUntil: daysUntilRenewal,
    });
  }

  items.sort((a, b) => a.daysUntil - b.daysUntil || b.amount - a.amount);

  return { total: items.reduce((sum, item) => sum + item.amount, 0), items };
}

/* 4. Price rises */
export interface PriceHike {
  readonly subscription: Subscription;
  readonly from: PricePoint;
  readonly to: PricePoint;
  /** Fraction (0.2 = 20%), or null when the old price was zero. */
  readonly pct: number | null;
}

/** Active plans whose most recent logged price is higher than the one before. */
export function recentPriceHikes(
  subscriptions: readonly Subscription[],
  today: Date,
  withinDays: number = PRICE_HIKE_DAYS,
): PriceHike[] {
  const reference = civilDate(today);
  const hikes: PriceHike[] = [];

  for (const subscription of subscriptions) {
    const history = subscription.priceHistory;
    if (!isActive(subscription) || history.length < 2) {
      continue;
    }
    const to = history[history.length - 1];
    const from = history[history.length - 2];
    if (!to || !from || to.currency !== from.currency || to.amount <= from.amount) {
      continue;
    }
    if (!ISO_DATE.test(to.at)) {
      continue;
    }
    const age = diffInDays(parseIsoDate(to.at), reference);
    if (age < 0 || age > withinDays) {
      continue;
    }
    hikes.push({
      subscription,
      from,
      to,
      pct: from.amount === 0 ? null : (to.amount - from.amount) / from.amount,
    });
  }

  return hikes.sort((a, b) => (a.to.at < b.to.at ? 1 : a.to.at > b.to.at ? -1 : 0));
}

/* 5. Unsure plans that have waited too long */
export interface UnsureReview {
  /** Most expensive first. */
  readonly items: readonly Subscription[];
  readonly annual: number;
}

function decidedOn(subscription: Subscription): string | null {
  const date = subscription.decisionUpdatedAt
    ? subscription.decisionUpdatedAt.slice(0, 10)
    : subscription.updatedAt.slice(0, 10);
  return ISO_DATE.test(date) ? date : null;
}

export function staleUnsure(
  subscriptions: readonly Subscription[],
  today: Date,
  currency: CurrencyCode,
  fxToNgn: FxToNgn,
  afterDays: number = UNSURE_REVIEW_DAYS,
): UnsureReview {
  const reference = civilDate(today);
  const rows: { subscription: Subscription; monthly: number }[] = [];

  for (const subscription of subscriptions) {
    if (!isActive(subscription) || subscription.decision !== "unsure") {
      continue;
    }
    const date = decidedOn(subscription);
    if (date === null || diffInDays(parseIsoDate(date), reference) < afterDays) {
      continue;
    }
    rows.push({
      subscription,
      monthly: costOf(subscription, currency, fxToNgn).monthly,
    });
  }

  rows.sort((a, b) => b.monthly - a.monthly);

  return {
    items: rows.map((row) => row.subscription),
    annual: rows.reduce((sum, row) => sum + row.monthly, 0) * 12,
  };
}
