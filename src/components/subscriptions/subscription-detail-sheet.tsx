"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Mascot } from "@/components/brand/mascot";
import { useToast } from "@/components/providers/toast-provider";
import { ShareCardDialog } from "@/components/share/share-card-dialog";
import { useCelebration } from "@/components/shell/celebration";
import { Button } from "@/components/ui/button";
import { MoneyText } from "@/components/ui/money-text";
import { Sheet } from "@/components/ui/sheet";
import { SwipeButton } from "@/components/ui/swipe-button";
import {
  BellIcon,
  CalendarIcon,
  CheckIcon,
  CloseIcon,
  ExternalLinkIcon,
  PencilIcon,
  ShareIcon,
  TrashIcon,
  TrendUpIcon,
} from "@/components/ui/icons";
import {
  advanceRenewal,
  convertTrial,
  deleteSubscription,
  restoreSubscription,
  setSubscriptionDecision,
  setSubscriptionLeadDays,
  setSubscriptionStatus,
} from "@/lib/db/subscriptions";
import { useSubscription } from "@/lib/db/hooks";
import { annualAmount, monthlyAmount } from "@/lib/domain/spend";
import { computeCancelWindow } from "@/lib/domain/cancel-by";
import {
  advance,
  advanceToFuture,
  cycleLabel,
  cycleShortLabel,
} from "@/lib/domain/cycle";
import { civilDate, diffInDays, formatIsoDate, parseIsoDate } from "@/lib/domain/date";
import { formatCountdown, formatDate } from "@/lib/domain/format";
import { buildCalendar, CALENDAR_MIME_TYPE } from "@/lib/domain/ics";
import { priceChange } from "@/lib/domain/price-history";
import {
  CHARGE_STATUS_LABELS,
  DECISION_LABELS,
  DECISIONS,
  PAID_VIA_LABELS,
  getCategory,
  type Subscription,
} from "@/lib/domain/schema";
import {
  getBillingDay,
  getChargeStatus,
  getEffectiveAmount,
  getPaidVia,
  getTrialEnd,
  hasPaymentProblem,
} from "@/lib/domain/subscription";
import type { UrgencyLevel } from "@/lib/domain/urgency";
import { useToday } from "@/lib/hooks/use-today";
import { cn } from "@/lib/utils/cn";
import { downloadTextFile } from "@/lib/utils/download";
import { vibrate } from "@/lib/utils/haptics";
import { useSubscriptionSheet } from "./subscription-sheet";

interface SubscriptionDetailContextValue {
  openDetail: (subscription: Subscription) => void;
}

const SubscriptionDetailContext = createContext<SubscriptionDetailContextValue | null>(
  null,
);

const ACCENT_BY_URGENCY: Record<UrgencyLevel, string> = {
  today: "bg-coral",
  urgent: "bg-coral",
  missed: "bg-coral",
  soon: "bg-yellow",
  safe: "bg-lime",
  past: "bg-paper-soft",
};

const REMINDER_CHOICES = [0, 1, 3, 7] as const;

export function SubscriptionDetailProvider({ children }: { children: ReactNode }) {
  const { openEdit } = useSubscriptionSheet();
  const { showToast } = useToast();
  const { celebrate } = useCelebration();
  const today = useToday();
  const [id, setId] = useState<string | null>(null);
  const subscription = useSubscription(id ?? "");

  const openDetail = useCallback((next: Subscription) => setId(next.id), []);
  const close = useCallback(() => setId(null), []);

  const api = useMemo<SubscriptionDetailContextValue>(
    () => ({ openDetail }),
    [openDetail],
  );

  async function handleAdvance(target: Subscription) {
    const window = computeCancelWindow(target, new Date());
    const nextDate = advance(
      parseIsoDate(window.renewal),
      target.cycle,
      getBillingDay(target),
    );
    try {
      await advanceRenewal(target.id, formatIsoDate(nextDate));
      showToast(`Next charge set to ${formatDate(formatIsoDate(nextDate))}`, "success");
    } catch {
      showToast("Could not update the renewal date", "danger");
    }
  }

  async function handleConvertTrial(target: Subscription) {
    const firstCharge = parseIsoDate(target.nextRenewal);
    const nextDate =
      diffInDays(civilDate(), firstCharge) >= 0
        ? firstCharge
        : advanceToFuture(firstCharge, target.cycle, civilDate(), getBillingDay(target));
    try {
      await convertTrial(target.id, formatIsoDate(nextDate));
      showToast(
        `Trial converted. Next charge ${formatDate(formatIsoDate(nextDate))}`,
        "success",
      );
    } catch {
      showToast("Could not update this trial", "danger");
    }
  }

  async function handleCancel(target: Subscription) {
    vibrate([10, 30, 10]);
    try {
      await setSubscriptionStatus(target.id, "cancelled");
      close();
      celebrate(target, {
        onUndo: async () => {
          await setSubscriptionStatus(target.id, "active");
        },
      });
    } catch {
      showToast("Could not cancel this subscription", "danger");
    }
  }

  async function handleReactivate(target: Subscription) {
    vibrate(8);
    try {
      await setSubscriptionStatus(target.id, "active");
      showToast("Subscription reactivated", "success");
    } catch {
      showToast("Could not reactivate this subscription", "danger");
    }
  }

  async function handleDelete(target: Subscription) {
    vibrate(12);
    try {
      await deleteSubscription(target.id);
      close();
      showToast("Subscription deleted", "success", {
        label: "Undo",
        onClick: () => {
          void restoreSubscription(target)
            .then(() => showToast(`${target.name} restored`, "success"))
            .catch(() => showToast("Could not restore that subscription", "danger"));
        },
      });
    } catch {
      showToast("Could not delete this subscription", "danger");
    }
  }

  async function handleLeadDays(target: Subscription, leadDays: number) {
    try {
      await setSubscriptionLeadDays(target.id, leadDays);
      showToast(
        leadDays === 0
          ? "We'll remind you on the day"
          : `We'll remind you ${leadDays} ${leadDays === 1 ? "day" : "days"} before`,
        "success",
      );
    } catch {
      showToast("Could not update the reminder", "danger");
    }
  }

  function handleEdit(target: Subscription) {
    close();
    openEdit(target);
  }

  const open = id !== null && subscription !== undefined;

  return (
    <SubscriptionDetailContext.Provider value={api}>
      {children}
      <Sheet
        open={open}
        onClose={close}
        tone="dark"
        size="lg"
        padded={false}
        footerPadded={false}
        ariaLabel={subscription ? `${subscription.name} details` : "Subscription details"}
        header={
          subscription ? (
            <DetailHeader
              subscription={subscription}
              today={today}
              onClose={close}
              onEdit={() => handleEdit(subscription)}
            />
          ) : undefined
        }
        footer={
          subscription ? (
            <div className="rounded-b-[2rem] bg-surface px-5 pt-3 pb-safe-3 sm:px-7 sm:pb-safe-5">
              {subscription.status === "active" ? (
                <div className="flex flex-col gap-2.5 min-[360px]:flex-row min-[360px]:gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => handleEdit(subscription)}
                    className="flex-1"
                    leadingIcon={<PencilIcon width={18} height={18} />}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => void handleCancel(subscription)}
                    className="flex-1"
                    leadingIcon={<CloseIcon width={18} height={18} />}
                  >
                    Cancel plan
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 min-[360px]:flex-row min-[360px]:gap-3">
                  <Button
                    variant="danger"
                    onClick={() => void handleDelete(subscription)}
                    className="flex-1"
                    leadingIcon={<TrashIcon width={18} height={18} />}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => void handleReactivate(subscription)}
                    className="flex-1"
                  >
                    Reactivate
                  </Button>
                </div>
              )}
            </div>
          ) : null
        }
      >
        {open && subscription && today ? (
          <DetailBody
            subscription={subscription}
            today={today}
            onAdvance={handleAdvance}
            onConvertTrial={handleConvertTrial}
            onCancel={handleCancel}
            onLeadDays={handleLeadDays}
          />
        ) : null}
      </Sheet>
    </SubscriptionDetailContext.Provider>
  );
}

function DetailHeader({
  subscription,
  today,
  onClose,
  onEdit,
}: {
  subscription: Subscription;
  today: Date | null;
  onClose: () => void;
  onEdit: () => void;
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const closeShare = useCallback(() => setShareOpen(false), []);
  const window = today ? computeCancelWindow(subscription, today) : null;
  const cancelled = subscription.status === "cancelled";
  const variant = cancelled
    ? "calm"
    : window?.urgency === "today" ||
        window?.urgency === "urgent" ||
        window?.urgency === "missed"
      ? "alarmed"
      : window?.urgency === "past"
        ? "sleepy"
        : "happy";

  return (
    <header className="relative overflow-hidden bg-dark px-5 pt-1 pb-6 text-paper sm:px-7">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex size-11 items-center justify-center rounded-full bg-paper/10 text-paper transition-colors hover:bg-paper/15"
        >
          <CloseIcon width={20} height={20} />
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            aria-label="Share as image"
            className="flex size-11 items-center justify-center rounded-full bg-paper/10 text-paper transition-colors hover:bg-paper/15"
          >
            <ShareIcon width={19} height={19} />
          </button>
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit subscription"
            className="flex size-11 items-center justify-center rounded-full bg-paper/10 text-paper transition-colors hover:bg-paper/15"
          >
            <PencilIcon width={19} height={19} />
          </button>
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-paper/10 px-2.5 py-1 text-[11px] font-bold tracking-[0.12em] text-paper/65 uppercase">
              {getCategory(subscription.category).label}
            </span>
            {subscription.isTrial ? (
              <span className="rounded-full bg-coral px-2.5 py-1 text-[11px] font-bold text-ink-fixed">
                Trial
              </span>
            ) : null}
            {cancelled ? (
              <span className="rounded-full bg-lime px-2.5 py-1 text-[11px] font-bold text-ink-fixed">
                Cancelled
              </span>
            ) : null}
          </div>
          <h2 className="line-clamp-3 font-display text-[clamp(2.1rem,10vw,2.8rem)] leading-[0.85] font-extrabold tracking-[-0.06em] text-balance break-words">
            {subscription.name}
          </h2>
          <p className="text-sm font-semibold text-paper/55">
            <MoneyText
              amount={getEffectiveAmount(subscription)}
              currency={subscription.currency}
            />{" "}
            · {cycleShortLabel(subscription.cycle)}
            {subscription.myShare !== null && subscription.myShare !== undefined
              ? " · your share"
              : ""}
          </p>
        </div>
        <Mascot
          variant={variant}
          color="var(--color-yellow)"
          size={104}
          className="hidden shrink-0 animate-float min-[360px]:block"
        />
      </div>
      {shareOpen ? (
        <ShareCardDialog
          subscription={subscription}
          defaultIncludeAmount={cancelled}
          onClose={closeShare}
        />
      ) : null}
    </header>
  );
}

interface DetailBodyProps {
  subscription: Subscription;
  today: Date;
  onAdvance: (subscription: Subscription) => void;
  onConvertTrial: (subscription: Subscription) => void;
  onCancel: (subscription: Subscription) => void;
  onLeadDays: (subscription: Subscription, leadDays: number) => void;
}

function DetailBody({
  subscription,
  today,
  onAdvance,
  onConvertTrial,
  onCancel,
  onLeadDays,
}: DetailBodyProps) {
  const { showToast } = useToast();
  const cancelWindow = computeCancelWindow(subscription, today);
  const cancelled = subscription.status === "cancelled";
  const change = priceChange(subscription.priceHistory);
  const paymentProblem = hasPaymentProblem(subscription);
  const trialEnded =
    subscription.isTrial && cancelWindow.daysUntilRenewal < 0 && !cancelled;
  const accent = cancelled ? "bg-surface" : ACCENT_BY_URGENCY[cancelWindow.urgency];
  const monthlySavings = monthlyAmount(
    getEffectiveAmount(subscription),
    subscription.cycle,
  );
  const annualSavings = annualAmount(
    getEffectiveAmount(subscription),
    subscription.cycle,
  );

  async function handleDecision(decision: (typeof DECISIONS)[number]) {
    try {
      await setSubscriptionDecision(
        subscription.id,
        subscription.decision === decision ? null : decision,
      );
      showToast(
        subscription.decision === decision
          ? `Removed the ${DECISION_LABELS[decision].toLowerCase()} tag`
          : `${DECISION_LABELS[decision]} tag saved`,
        "success",
      );
    } catch {
      showToast("Could not save that tag", "danger");
    }
  }
  const reminderChoices = REMINDER_CHOICES.includes(
    subscription.leadDays as (typeof REMINDER_CHOICES)[number],
  )
    ? [...REMINDER_CHOICES]
    : [...REMINDER_CHOICES, subscription.leadDays];

  function handleAddToCalendar() {
    const slug =
      subscription.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "reminder";
    downloadTextFile(
      `undue-${slug}.ics`,
      buildCalendar([subscription]),
      CALENDAR_MIME_TYPE,
    );
    showToast("Calendar reminder downloaded", "success");
  }

  return (
    <div className="flex min-h-full flex-col gap-5 bg-bone px-5 py-5 sm:px-7 sm:py-6">
      <section
        className={cn(
          "relative overflow-hidden rounded-[1.75rem] p-5 shadow-card",
          accent,
          cancelled ? "text-ink" : "text-ink-fixed",
        )}
      >
        <div className="relative z-10 flex flex-col gap-1 min-[360px]:pr-24">
          <span
            className={cn(
              "text-[11px] font-bold tracking-[0.14em] uppercase",
              cancelled ? "text-muted" : "text-ink-fixed/60",
            )}
          >
            {cancelled
              ? "Status"
              : trialEnded
                ? "Trial ended"
                : "Your last day to cancel"}
          </span>
          <span className="font-display text-3xl leading-none font-extrabold tracking-[-0.05em]">
            {cancelled ? "Cancelled" : formatDate(cancelWindow.cancelBy)}
          </span>
          <span
            className={cn(
              "text-xs leading-relaxed font-semibold",
              cancelled ? "text-muted" : "text-ink-fixed/70",
            )}
          >
            {cancelled
              ? "You stopped this one. Reactivate it if you keep the plan."
              : trialEnded
                ? "If you did not cancel, this plan is now paid. Confirm the conversion or cancel it."
                : cancelWindow.urgency === "today"
                  ? "That's today. Cancel before the next charge."
                  : cancelWindow.urgency === "missed"
                    ? "The safe window has passed. Check the provider before the charge."
                    : cancelWindow.urgency === "past"
                      ? "This renewal date has passed. Mark it renewed to move to the next cycle."
                      : `${formatCountdown(cancelWindow.daysUntilCancelBy)} left before it renews.`}
          </span>
        </div>
        <Mascot
          variant={
            cancelled
              ? "calm"
              : cancelWindow.urgency === "today" ||
                  cancelWindow.urgency === "urgent" ||
                  cancelWindow.urgency === "missed"
                ? "alarmed"
                : cancelWindow.urgency === "past"
                  ? "sleepy"
                  : "happy"
          }
          color={cancelled ? "var(--color-lime)" : "var(--color-paper)"}
          size={92}
          className="pointer-events-none absolute -right-1 -bottom-3 hidden min-[360px]:block"
        />
        {!cancelled ? (
          <span className="relative z-10 mt-4 inline-flex items-center rounded-full bg-ink-fixed px-3 py-1.5 text-[11px] font-bold text-paper">
            {cancelWindow.urgency === "past"
              ? "Renewed"
              : formatCountdown(cancelWindow.daysUntilCancelBy)}
          </span>
        ) : null}
      </section>

      {!cancelled ? (
        <div className="flex flex-col gap-2 rounded-[1.5rem] bg-surface p-4 shadow-card">
          <span className="text-[11px] font-bold tracking-[0.13em] text-muted uppercase">
            Decision
          </span>
          <p className="text-sm font-semibold text-ink">
            Cancelling saves{" "}
            <MoneyText amount={monthlySavings} currency={subscription.currency} /> / month
            (
            <MoneyText amount={annualSavings} currency={subscription.currency} /> a year).
          </p>
          <div
            role="radiogroup"
            aria-label="Decision for this plan"
            className="grid grid-cols-3 gap-2"
          >
            {DECISIONS.map((choice) => {
              const active = subscription.decision === choice;
              return (
                <button
                  key={choice}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => void handleDecision(choice)}
                  className={cn(
                    "inline-flex min-h-11 items-center justify-center rounded-full border px-2 text-xs font-bold transition-colors",
                    active
                      ? "border-ink bg-ink text-bone"
                      : "border-line bg-surface-soft text-muted hover:text-ink",
                  )}
                >
                  {DECISION_LABELS[choice]}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {!cancelled ? (
        <div className="flex flex-col gap-2">
          <SwipeButton
            label="Swipe to mark cancelled"
            onComplete={() => onCancel(subscription)}
          />
          <p className="text-center text-[11px] font-medium text-muted">
            You can undo this if you change your mind.
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-2.5 min-[360px]:grid-cols-2">
        {subscription.cancelUrl ? (
          <button
            type="button"
            onClick={() =>
              window.open(subscription.cancelUrl ?? "", "_blank", "noopener")
            }
            className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-surface px-4 text-sm font-bold text-ink shadow-card transition-colors hover:bg-surface-soft"
          >
            <ExternalLinkIcon width={18} height={18} />
            How to cancel
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleAddToCalendar}
          className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-surface px-4 text-sm font-bold text-ink shadow-card transition-colors hover:bg-surface-soft"
        >
          <CalendarIcon width={18} height={18} />
          Add to calendar
        </button>
        {!cancelled ? (
          <button
            type="button"
            onClick={() =>
              subscription.isTrial
                ? onConvertTrial(subscription)
                : onAdvance(subscription)
            }
            className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-surface px-4 text-sm font-bold text-ink shadow-card transition-colors hover:bg-surface-soft"
          >
            <CheckIcon width={18} height={18} />
            {subscription.isTrial
              ? trialEnded
                ? "Confirm conversion"
                : "It converted"
              : "It renewed"}
          </button>
        ) : null}
      </div>

      {trialEnded ? (
        <div className="rounded-[1.5rem] border border-yellow/70 bg-yellow/25 p-4 text-sm font-semibold text-ink">
          <p className="font-bold">This free trial has ended.</p>
          <p className="mt-1 text-muted">
            Confirm it converted to move the next charge forward, or cancel the plan
            before the first paid renewal.
          </p>
        </div>
      ) : null}

      {paymentProblem ? (
        <div className="rounded-[1.5rem] border border-urgent/30 bg-urgent-soft p-4 text-sm font-semibold text-urgent">
          Last charge marked{" "}
          {CHARGE_STATUS_LABELS[getChargeStatus(subscription)].toLowerCase()}. Check the
          card or provider before the next renewal.
        </div>
      ) : null}

      {!cancelled ? (
        <section className="flex flex-col gap-3 rounded-[1.5rem] bg-surface p-4 shadow-card">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-yellow text-ink-fixed">
              <BellIcon width={16} height={16} />
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-ink">Remind me</span>
              <span className="text-[11px] text-muted">Before the last safe day</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {reminderChoices.map((days) => {
              const selected = subscription.leadDays === days;
              return (
                <button
                  key={days}
                  type="button"
                  onClick={() => void onLeadDays(subscription, days)}
                  aria-pressed={selected}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-xs font-bold transition-colors",
                    selected
                      ? "bg-ink text-bone"
                      : "bg-surface-soft text-muted hover:text-ink",
                  )}
                >
                  {days === 0 ? "On the day" : `${days} ${days === 1 ? "day" : "days"}`}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <dl className="flex flex-col divide-y divide-line rounded-[1.5rem] bg-surface px-4 shadow-card">
        <DetailRow label="Charge">
          <span className="inline-flex flex-wrap items-baseline justify-end gap-1.5">
            <MoneyText
              amount={getEffectiveAmount(subscription)}
              currency={subscription.currency}
            />
            <span className="text-muted">
              · {cycleShortLabel(subscription.cycle)}
              {subscription.myShare !== null && subscription.myShare !== undefined
                ? " · your share"
                : ""}
            </span>
          </span>
        </DetailRow>
        <DetailRow label="Billing cycle">{cycleLabel(subscription.cycle)}</DetailRow>
        {subscription.isTrial ? (
          <DetailRow label="Trial ends">
            {formatDate(getTrialEnd(subscription) ?? subscription.nextRenewal)}
          </DetailRow>
        ) : null}
        <DetailRow label={subscription.isTrial ? "First charge" : "Next charge"}>
          {formatDate(
            subscription.isTrial ? subscription.nextRenewal : cancelWindow.renewal,
          )}
        </DetailRow>
        <DetailRow label="Paid via">
          {PAID_VIA_LABELS[getPaidVia(subscription)]}
        </DetailRow>
        <DetailRow label="Last charge">
          {CHARGE_STATUS_LABELS[getChargeStatus(subscription)]}
        </DetailRow>
        <DetailRow label="Reminder window">
          {subscription.leadDays === 0
            ? "On the day"
            : `${subscription.leadDays} ${
                subscription.leadDays === 1 ? "day" : "days"
              } before`}
        </DetailRow>
      </dl>

      {change ? (
        <section className="flex flex-col gap-3 rounded-[1.5rem] bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold tracking-[0.13em] text-coral-ink uppercase">
              Price history
            </span>
            {change.increased ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-urgent-soft px-2.5 py-1 text-xs font-bold text-urgent">
                <TrendUpIcon width={13} height={13} />
                <MoneyText amount={change.delta} currency={subscription.currency} />
                {change.pct !== null ? ` · ${Math.round(change.pct)}%` : null}
              </span>
            ) : null}
          </div>
          <ul className="flex flex-col gap-1.5">
            {[...subscription.priceHistory].reverse().map((point, index, list) => {
              const previous = list[index + 1];
              const isLatest = index === 0;
              return (
                <li
                  key={`${point.at}-${point.amount}-${index}`}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="text-muted">{formatDate(point.at)}</span>
                  <span className="flex items-center gap-2">
                    {previous &&
                    previous.amount !== point.amount &&
                    previous.currency === point.currency ? (
                      <span
                        className={cn(
                          "text-xs",
                          point.amount > previous.amount ? "text-urgent" : "text-safe",
                        )}
                      >
                        {point.amount > previous.amount ? "+" : "−"}
                        <MoneyText
                          amount={Math.abs(point.amount - previous.amount)}
                          currency={point.currency}
                        />
                      </span>
                    ) : null}
                    <MoneyText
                      amount={point.amount}
                      currency={point.currency}
                      className={cn(
                        "font-semibold",
                        isLatest ? "text-ink" : "text-muted",
                      )}
                    />
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {subscription.notes ? (
        <div className="rounded-[1.5rem] bg-surface p-4 shadow-card">
          <span className="text-[11px] font-bold tracking-[0.13em] text-muted uppercase">
            Notes
          </span>
          <p className="mt-1 text-sm whitespace-pre-wrap text-ink">
            {subscription.notes}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-semibold text-ink">{children}</dd>
    </div>
  );
}

export function useSubscriptionDetail(): SubscriptionDetailContextValue {
  const context = useContext(SubscriptionDetailContext);
  if (!context) {
    throw new Error(
      "useSubscriptionDetail must be used within a SubscriptionDetailProvider",
    );
  }
  return context;
}
