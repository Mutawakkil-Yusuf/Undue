import { computeCancelWindow } from "@/lib/domain/cancel-by";
import { formatMoney, formatMoneyRounded } from "@/lib/domain/currency";
import { cycleShortLabel } from "@/lib/domain/cycle";
import { todayIso } from "@/lib/domain/date";
import { formatCountdown, formatDate } from "@/lib/domain/format";
import type { Subscription } from "@/lib/domain/schema";
import { annualAmount, effectiveAmount } from "@/lib/domain/spend";
import type { UrgencyLevel } from "@/lib/domain/urgency";
import { SITE_HOST, SITE_URL } from "@/lib/site";

export type ShareTone = "coral" | "yellow" | "lime" | "cream";
export type ShareMascot = "happy" | "calm" | "alarmed" | "sleepy" | "party";

/**
 * Everything the share image shows, already formatted as text. Keeping this a
 * plain data object means the wording is unit-tested and the canvas renderer
 * has no business logic.
 */
export interface ShareCardSpec {
  readonly kind: "deadline" | "saved";
  readonly tone: ShareTone;
  readonly mascot: ShareMascot;
  /** Small label in the top-right corner. */
  readonly pill: string;
  readonly eyebrow: string;
  /** The service name. */
  readonly title: string;
  /** The headline figure: a date or an amount. */
  readonly value: string;
  readonly valueSub: string;
  readonly detail: string;
  readonly alt: string;
  readonly filename: string;
  readonly shareText: string;
  /** Whether the card contains a price, so the UI can offer to hide it. */
  readonly showsAmount: boolean;
}

export interface ShareCardOptions {
  readonly includeAmount: boolean;
}

const TONE_BY_URGENCY: Record<UrgencyLevel, ShareTone> = {
  today: "coral",
  urgent: "coral",
  missed: "coral",
  soon: "yellow",
  safe: "lime",
  past: "cream",
};

const MASCOT_BY_URGENCY: Record<UrgencyLevel, ShareMascot> = {
  today: "alarmed",
  urgent: "alarmed",
  missed: "alarmed",
  soon: "calm",
  safe: "happy",
  past: "sleepy",
};

export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "subscription"
  );
}

function countdownLabel(urgency: UrgencyLevel, daysUntilCancelBy: number): string {
  switch (urgency) {
    case "today":
      return "Last day is today";
    case "missed":
      return "Window passed";
    case "past":
      return "Already renewed";
    case "urgent":
    case "soon":
    case "safe":
      return `${formatCountdown(daysUntilCancelBy)} left to cancel`;
  }
}

function pillLabel(urgency: UrgencyLevel, isTrial: boolean): string {
  if (isTrial && urgency !== "past") {
    return "Free trial";
  }
  switch (urgency) {
    case "today":
      return "Cancel today";
    case "urgent":
      return "Cancel now";
    case "soon":
      return "Cancel soon";
    case "missed":
      return "Window passed";
    case "past":
      return "Renewed";
    case "safe":
      return "On track";
  }
}

const PITCH = `Track yours free at ${SITE_HOST}`;

export function buildDeadlineCardSpec(
  subscription: Subscription,
  today: Date,
  options: ShareCardOptions,
): ShareCardSpec {
  const window = computeCancelWindow(subscription, today);
  const cancelBy = formatDate(window.cancelBy);
  const renews = formatDate(subscription.nextRenewal);
  const price = options.includeAmount
    ? `${formatMoney(subscription.amount, subscription.currency)} ${cycleShortLabel(subscription.cycle)}`
    : null;

  const chargeVerb = subscription.isTrial ? "Converts to paid" : "Renews";
  const detail = [`${chargeVerb} ${renews}`, price].filter(Boolean).join(" · ");

  return {
    kind: "deadline",
    tone: TONE_BY_URGENCY[window.urgency],
    mascot: MASCOT_BY_URGENCY[window.urgency],
    pill: pillLabel(window.urgency, subscription.isTrial),
    eyebrow: "Last day to cancel",
    title: subscription.name,
    value: cancelBy,
    valueSub: countdownLabel(window.urgency, window.daysUntilCancelBy),
    detail,
    alt: `Undue card: the last day to cancel ${subscription.name} is ${cancelBy}.`,
    filename: `undue-${slugify(subscription.name)}-deadline.png`,
    shareText: `${subscription.name}: the last day to cancel is ${cancelBy}. Tracked with Undue. ${PITCH}\n${SITE_URL}`,
    showsAmount: options.includeAmount,
  };
}

export function buildSavedCardSpec(
  subscription: Subscription,
  today: Date,
  options: ShareCardOptions,
): ShareCardSpec {
  const yearly = annualAmount(effectiveAmount(subscription), subscription.cycle);
  const cancelledOn = formatDate(todayIso(today));

  const value = options.includeAmount
    ? formatMoneyRounded(yearly, subscription.currency)
    : "One less charge";
  const valueSub = options.includeAmount ? "saved every year" : "cancelled before it hit";

  return {
    kind: "saved",
    tone: "lime",
    mascot: "party",
    pill: "Cancelled",
    eyebrow: "I cancelled on time",
    title: subscription.name,
    value,
    valueSub,
    detail: `Stopped on ${cancelledOn}, before the next charge.`,
    alt: options.includeAmount
      ? `Undue card: cancelled ${subscription.name} and saved ${value} a year.`
      : `Undue card: cancelled ${subscription.name} before the next charge.`,
    filename: `undue-${slugify(subscription.name)}-cancelled.png`,
    shareText: options.includeAmount
      ? `I cancelled ${subscription.name} on time and saved ${value} a year. ${PITCH}\n${SITE_URL}`
      : `I cancelled ${subscription.name} before it charged me again. ${PITCH}\n${SITE_URL}`,
    showsAmount: options.includeAmount,
  };
}

/** Picks the right card for a subscription's current state. */
export function buildCardSpecFor(
  subscription: Subscription,
  today: Date,
  options: ShareCardOptions,
): ShareCardSpec {
  return subscription.status === "cancelled"
    ? buildSavedCardSpec(subscription, today, options)
    : buildDeadlineCardSpec(subscription, today, options);
}
