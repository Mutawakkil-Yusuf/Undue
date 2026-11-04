import { computeCancelWindow } from "./cancel-by";
import { formatDate } from "./format";
import type { Subscription } from "./schema";

/**
 * Each reminder stage is sent at most once per renewal, so a missed window
 * produces one notice instead of a daily nag, and a trial gets an extra early
 * heads-up because it converts to a paid plan without the user doing anything.
 */
export type ReminderStage = "soon" | "urgent" | "today" | "missed";

export interface Reminder {
  /** Stable de-duplication key: one per subscription, renewal date and stage. */
  readonly key: string;
  readonly subscriptionId: string;
  readonly name: string;
  readonly stage: ReminderStage;
  readonly title: string;
  readonly body: string;
}

export interface ReminderNotification {
  readonly title: string;
  readonly body: string;
  readonly tag: string;
}

function dayWord(days: number): string {
  return days === 1 ? "1 day" : `${days} days`;
}

function describe(
  subscription: Subscription,
  stage: ReminderStage,
  daysUntilCancelBy: number,
): { title: string; body: string } {
  const { name, isTrial } = subscription;
  const renews = formatDate(subscription.nextRenewal);
  switch (stage) {
    case "today":
      return {
        title: isTrial ? `Cancel the ${name} trial today` : `Cancel ${name} today`,
        body: isTrial
          ? `Today is the last safe day before the free trial turns into a paid plan on ${renews}.`
          : `Today is the last safe day to cancel before it renews on ${renews}.`,
      };
    case "urgent":
      return {
        title: `${name}: ${dayWord(daysUntilCancelBy)} left to cancel`,
        body: isTrial
          ? `The free trial converts to a paid plan on ${renews}.`
          : `It renews on ${renews}.`,
      };
    case "soon":
      return {
        title: `${name} trial converts in ${dayWord(daysUntilCancelBy)}`,
        body: `You will be charged on ${renews} unless you cancel first.`,
      };
    case "missed":
      return {
        title: `${name}: the cancel window has passed`,
        body: `It renews on ${renews}. Check with the provider if you still want out.`,
      };
  }
}

/** Reminders that apply to a single subscription today, before de-duplication. */
export function reminderFor(subscription: Subscription, clock: Date): Reminder | null {
  if (subscription.status !== "active") {
    return null;
  }
  const { urgency, daysUntilCancelBy } = computeCancelWindow(subscription, clock);

  let stage: ReminderStage | null = null;
  if (urgency === "today" || urgency === "urgent" || urgency === "missed") {
    stage = urgency;
  } else if (urgency === "soon" && subscription.isTrial) {
    stage = "soon";
  }
  if (stage === null) {
    return null;
  }

  return {
    key: `${subscription.id}|${subscription.nextRenewal}|${stage}`,
    subscriptionId: subscription.id,
    name: subscription.name,
    stage,
    ...describe(subscription, stage, daysUntilCancelBy),
  };
}

export function selectReminders(
  subscriptions: readonly Subscription[],
  clock: Date,
): Reminder[] {
  const reminders: Reminder[] = [];
  for (const subscription of subscriptions) {
    const reminder = reminderFor(subscription, clock);
    if (reminder) {
      reminders.push(reminder);
    }
  }
  return reminders;
}

/** One notification for a batch: the single reminder itself, or a summary. */
export function toNotification(
  reminders: readonly Reminder[],
): ReminderNotification | null {
  const [first] = reminders;
  if (!first) {
    return null;
  }
  if (reminders.length === 1) {
    return { title: first.title, body: first.body, tag: `undue-${first.subscriptionId}` };
  }
  const names = reminders.slice(0, 3).map((reminder) => reminder.name);
  const extra = reminders.length - names.length;
  return {
    title: `${reminders.length} subscriptions need attention`,
    body: `${names.join(", ")}${extra > 0 ? ` and ${extra} more` : ""}.`,
    tag: "undue-reminders",
  };
}
