"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { MoneyText } from "@/components/ui/money-text";
import { ServiceAvatar } from "@/components/ui/service-avatar";
import { Sheet } from "@/components/ui/sheet";
import {
  CalendarIcon,
  ClockIcon,
  ExternalLinkIcon,
  PencilIcon,
  TrashIcon,
  TrendUpIcon,
} from "@/components/ui/icons";
import {
  advanceRenewal,
  deleteSubscription,
  restoreSubscription,
  setSubscriptionStatus,
} from "@/lib/db/subscriptions";
import { useSubscription } from "@/lib/db/hooks";
import { computeCancelWindow } from "@/lib/domain/cancel-by";
import { advance, cycleLabel, cycleShortLabel } from "@/lib/domain/cycle";
import { civilDate, diffInDays, formatIsoDate, parseIsoDate } from "@/lib/domain/date";
import { formatCountdown, formatDate } from "@/lib/domain/format";
import { buildCalendar, CALENDAR_MIME_TYPE } from "@/lib/domain/ics";
import { priceChange } from "@/lib/domain/price-history";
import { getCategory, type Subscription } from "@/lib/domain/schema";
import { getUrgencyPresentation, urgencySurfaceClass } from "@/lib/domain/urgency";
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

export function SubscriptionDetailProvider({ children }: { children: ReactNode }) {
  const { openEdit } = useSubscriptionSheet();
  const { showToast } = useToast();
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
    const nextDate = advance(parseIsoDate(target.nextRenewal), target.cycle);
    try {
      await advanceRenewal(target.id, formatIsoDate(nextDate));
      const stillPast = diffInDays(civilDate(), nextDate) <= 0;
      showToast(
        stillPast
          ? "Advanced one cycle — still in the past, try again."
          : `Next charge set to ${formatDate(formatIsoDate(nextDate))}`,
        "success",
      );
    } catch {
      showToast("Could not update the renewal date", "danger");
    }
  }

  async function handleStatus(target: Subscription, status: "active" | "cancelled") {
    vibrate(8);
    try {
      await setSubscriptionStatus(target.id, status);
      const previous = status === "cancelled" ? "active" : "cancelled";
      showToast(
        status === "cancelled" ? "Marked as cancelled" : "Subscription reactivated",
        "success",
        {
          label: "Undo",
          onClick: () => {
            void setSubscriptionStatus(target.id, previous).catch(() => {
              showToast("Could not undo that change", "danger");
            });
          },
        },
      );
    } catch {
      showToast("Could not update this subscription", "danger");
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
        title={subscription?.name ?? "Subscription"}
        description={subscription ? getCategory(subscription.category).label : undefined}
        footer={
          subscription ? (
            subscription.status === "active" ? (
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
                  onClick={() => handleStatus(subscription, "cancelled")}
                  className="flex-1"
                >
                  Mark cancelled
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 min-[360px]:flex-row min-[360px]:gap-3">
                <Button
                  variant="danger"
                  onClick={() => handleDelete(subscription)}
                  className="flex-1"
                  leadingIcon={<TrashIcon width={18} height={18} />}
                >
                  Delete
                </Button>
                <Button
                  onClick={() => handleStatus(subscription, "active")}
                  className="flex-1"
                >
                  Reactivate
                </Button>
              </div>
            )
          ) : null
        }
      >
        {open && subscription && today ? (
          <DetailBody
            subscription={subscription}
            today={today}
            onAdvance={handleAdvance}
          />
        ) : null}
      </Sheet>
    </SubscriptionDetailContext.Provider>
  );
}

interface DetailBodyProps {
  subscription: Subscription;
  today: Date;
  onAdvance: (subscription: Subscription) => void;
}

function DetailBody({ subscription, today, onAdvance }: DetailBodyProps) {
  const { showToast } = useToast();
  const cancelWindow = computeCancelWindow(subscription, today);
  const presentation = getUrgencyPresentation(cancelWindow.urgency);
  const cancelled = subscription.status === "cancelled";
  const change = priceChange(subscription.priceHistory);

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
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <ServiceAvatar
          category={subscription.category}
          size="lg"
          className={cancelled ? "opacity-60" : undefined}
        />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="flex min-w-0 items-center gap-2 font-display text-xl text-ink">
            {subscription.name}
            {subscription.isTrial ? (
              <span className="shrink-0 rounded-full bg-ember-soft px-2 py-0.5 text-[11px] font-medium text-ember-strong">
                Trial
              </span>
            ) : null}
          </span>
          <span className="text-sm text-muted">
            {getCategory(subscription.category).label}
          </span>
        </div>
      </div>

      {cancelled ? (
        <section className="rounded-card border border-line bg-line/40 p-4">
          <span className="text-xs font-medium tracking-wide text-muted uppercase">
            Status
          </span>
          <p className="mt-1 font-display text-xl text-ink">Cancelled</p>
          <p className="mt-1 text-sm text-muted">
            You marked this as cancelled. Reactivate it if you keep the plan.
          </p>
        </section>
      ) : (
        <section
          className={cn(
            "flex items-center justify-between gap-4 rounded-card p-4",
            urgencySurfaceClass(presentation.tone),
          )}
        >
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium tracking-wide uppercase opacity-90">
              Cancel by
            </span>
            <span className="font-display text-2xl">
              {formatDate(cancelWindow.cancelBy)}
            </span>
            <span className="text-sm opacity-90">{presentation.description}</span>
          </div>
          <span className="font-display font-tabular text-3xl">
            {formatCountdown(cancelWindow.daysUntilCancelBy)}
          </span>
        </section>
      )}

      <dl className="flex flex-col divide-y divide-line rounded-card border border-line">
        <DetailRow label="Charge">
          <span className="inline-flex items-baseline gap-1.5">
            <MoneyText amount={subscription.amount} currency={subscription.currency} />
            <span className="text-muted">· {cycleShortLabel(subscription.cycle)}</span>
          </span>
        </DetailRow>
        <DetailRow label="Billing cycle">{cycleLabel(subscription.cycle)}</DetailRow>
        <DetailRow label="Next charge">{formatDate(subscription.nextRenewal)}</DetailRow>
        <DetailRow label="Reminder window">
          {subscription.leadDays === 0
            ? "On the day"
            : `${subscription.leadDays} ${subscription.leadDays === 1 ? "day" : "days"} before`}
        </DetailRow>
      </dl>

      {change ? (
        <section className="flex flex-col gap-3 rounded-card border border-line bg-bone/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium tracking-wide text-muted uppercase">
              Price history
            </span>
            {change.increased ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-urgent-soft px-2.5 py-1 text-xs font-medium text-urgent">
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
                  key={`${point.at}-${point.amount}`}
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
                      className={cn("font-medium", isLatest ? "text-ink" : "text-muted")}
                    />
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {subscription.notes ? (
        <div className="rounded-card border border-line bg-bone/60 p-4">
          <span className="text-xs font-medium tracking-wide text-muted uppercase">
            Notes
          </span>
          <p className="mt-1 text-sm whitespace-pre-wrap text-ink">
            {subscription.notes}
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-2.5">
        {subscription.status === "active" ? (
          <Button
            variant="secondary"
            block
            onClick={() => onAdvance(subscription)}
            leadingIcon={<ClockIcon width={18} height={18} />}
          >
            It renewed — advance one cycle
          </Button>
        ) : null}
        {subscription.status === "active" ? (
          <Button
            variant="secondary"
            block
            onClick={handleAddToCalendar}
            leadingIcon={<CalendarIcon width={18} height={18} />}
          >
            Add cancel reminder to calendar
          </Button>
        ) : null}
        {subscription.cancelUrl ? (
          <Button
            variant="secondary"
            block
            onClick={() =>
              window.open(subscription.cancelUrl ?? "", "_blank", "noopener")
            }
            leadingIcon={<ExternalLinkIcon width={18} height={18} />}
          >
            Open cancellation page
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-ink">{children}</dd>
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
