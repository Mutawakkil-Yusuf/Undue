"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/providers/toast-provider";
import { useSubscriptions, useSettings } from "@/lib/db/hooks";
import { notificationTimeOf } from "@/lib/db/settings";
import { computeCancelWindow } from "@/lib/domain/cancel-by";
import { todayIso } from "@/lib/domain/date";
import { useNotificationsEnabled } from "@/lib/hooks/use-notifications";
import { useToday } from "@/lib/hooks/use-today";
import { setSubscriptionDecision } from "@/lib/db/subscriptions";
import { CloseIcon } from "@/components/ui/icons";
import {
  getNotificationPermission,
  isAtOrAfterNotificationTime,
  markNotified,
  markNotifiedEvents,
  markPromptedDecisionEvent,
  notificationsSupported,
  readLastNotified,
  readNotifiedEvents,
  readPromptedDecisionEvents,
} from "@/lib/notifications/notifications";

interface ReminderCandidate {
  key: string;
  priority: number;
  name: string;
  id: string;
  kind: "today" | "urgent" | "missed" | "soon" | "trial";
}

interface DecisionPrompt {
  key: string;
  id: string;
  name: string;
}

export function ReminderNotifier() {
  const subscriptions = useSubscriptions();
  const settings = useSettings();
  const today = useToday();
  const enabled = useNotificationsEnabled();
  const notificationTime = notificationTimeOf(settings);
  const { showToast } = useToast();
  const [prompt, setPrompt] = useState<DecisionPrompt | null>(null);

  useEffect(() => {
    if (!enabled || !today || !subscriptions) {
      return;
    }
    if (!isAtOrAfterNotificationTime(today, notificationTime)) {
      return;
    }

    const dayKey = todayIso(today);
    if (readLastNotified() === dayKey) {
      return;
    }

    const notified = readNotifiedEvents();
    const candidates: ReminderCandidate[] = [];

    for (const subscription of subscriptions) {
      if (subscription.status !== "active") {
        continue;
      }
      const window = computeCancelWindow(subscription, today);
      const base = `${subscription.id}:${window.renewal}`;

      if (subscription.isTrial && window.daysUntilRenewal < 0) {
        const key = `${base}:trial-ended`;
        if (!notified[key]) {
          candidates.push({
            key,
            priority: 1,
            name: subscription.name,
            id: subscription.id,
            kind: "trial",
          });
        }
      } else if (window.urgency === "today") {
        const key = `${base}:today:${dayKey}`;
        if (!notified[key]) {
          candidates.push({
            key,
            priority: 0,
            name: subscription.name,
            id: subscription.id,
            kind: "today",
          });
        }
      } else if (window.urgency === "urgent") {
        const key = `${base}:urgent:${dayKey}`;
        if (!notified[key]) {
          candidates.push({
            key,
            priority: 1,
            name: subscription.name,
            id: subscription.id,
            kind: "urgent",
          });
        }
      } else if (window.urgency === "soon") {
        const key = `${base}:soon`;
        if (!notified[key]) {
          candidates.push({
            key,
            priority: 3,
            name: subscription.name,
            id: subscription.id,
            kind: "soon",
          });
        }
      } else if (window.urgency === "missed") {
        const key = `${base}:missed`;
        if (!notified[key]) {
          candidates.push({
            key,
            priority: 2,
            name: subscription.name,
            id: subscription.id,
            kind: "missed",
          });
        }
      }
    }

    if (candidates.length === 0) {
      return;
    }

    candidates.sort((a, b) => a.priority - b.priority);
    const topPriority = candidates[0]?.priority ?? 3;
    const top = candidates.filter((candidate) => candidate.priority === topPriority);
    const names = top.map((candidate) => candidate.name);
    const firstName = names[0] ?? "A subscription";
    const kind = top[0]?.kind ?? "urgent";
    const firstCandidate = top[0];

    const title =
      kind === "today"
        ? top.length === 1
          ? `Cancel ${firstName} today`
          : `${top.length} deadlines today`
        : kind === "urgent"
          ? top.length === 1
            ? `Cancel ${firstName} soon`
            : `${top.length} cancel windows closing`
          : kind === "soon"
            ? top.length === 1
              ? `${firstName}'s cancel window is open`
              : `${top.length} cancel windows opening`
            : kind === "trial"
              ? `${firstName}'s trial has ended`
              : top.length === 1
                ? `${firstName}'s cancel window passed`
                : `${top.length} cancel windows passed`;

    const body =
      kind === "today"
        ? "Today is the last safe day to cancel before the next charge."
        : kind === "urgent"
          ? "The last safe day to cancel is within two days."
          : kind === "soon"
            ? "You have a week to cancel before the next charge."
            : kind === "trial"
              ? "The free trial has ended. Cancel now if you do not want the paid plan."
              : "The safe cancellation window has passed. Check the provider before the next charge.";

    const prompted = readPromptedDecisionEvents();
    const unprompted = firstCandidate
      ? top.find((candidate) => !prompted[`decision:${candidate.key}`])
      : null;
    let promptTimer: number | undefined;
    if (unprompted) {
      markPromptedDecisionEvent(`decision:${unprompted.key}`, dayKey);
      promptTimer = window.setTimeout(
        () =>
          setPrompt({
            id: unprompted.id,
            key: unprompted.key,
            name: unprompted.name,
          }),
        120,
      );
    }

    if (!notificationsSupported() || getNotificationPermission() !== "granted") {
      return promptTimer ? () => window.clearTimeout(promptTimer) : undefined;
    }

    const show = async () => {
      const options = {
        body,
        tag: "undue-reminders",
        data: { url: "/app", subscriptionId: firstCandidate?.id },
        actions: [
          { action: "keep", title: "Keep" },
          { action: "cut", title: "Cut" },
        ],
      };
      try {
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            await registration.showNotification(
              title,
              options as NotificationOptions & {
                actions: { action: string; title: string }[];
              },
            );
          } else {
            new Notification(title, options);
          }
        } else {
          new Notification(title, options);
        }
        markNotified(dayKey);
        markNotifiedEvents(
          top.map((candidate) => candidate.key),
          dayKey,
        );
      } catch {
        // Notifications can throw when permission is missing; ignore.
      }
    };

    void show();
    return promptTimer ? () => window.clearTimeout(promptTimer) : undefined;
  }, [enabled, notificationTime, subscriptions, today]);

  async function answer(decision: "keep" | "cut") {
    if (!prompt) {
      return;
    }
    try {
      await setSubscriptionDecision(prompt.id, decision);
      showToast(
        `${prompt.name} marked as ${decision === "keep" ? "Keep" : "Cut"}`,
        "success",
      );
    } catch {
      showToast("Couldn't save that decision", "danger");
    } finally {
      setPrompt(null);
    }
  }

  return prompt ? (
    <section
      role="dialog"
      aria-label={`Still using ${prompt.name}?`}
      aria-modal="false"
      className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom,0px)+112px)] left-4 z-[45] rounded-[1.5rem] border border-line bg-surface p-4 shadow-float sm:right-6 sm:left-auto sm:w-80"
    >
      <button
        type="button"
        onClick={() => setPrompt(null)}
        aria-label="Not now"
        className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-soft hover:text-ink"
      >
        <CloseIcon width={17} height={17} />
      </button>
      <p className="text-[11px] font-bold tracking-[0.13em] text-coral-ink uppercase">
        Decision time
      </p>
      <h2 className="mt-1 font-display text-xl leading-none font-extrabold tracking-[-0.04em] text-ink">
        Still using {prompt.name}?
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Keep it deliberately, or cut it before it renews.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => void answer("keep")}
          className="min-h-10 flex-1 rounded-full bg-safe-soft px-4 text-xs font-bold text-safe transition-colors hover:bg-safe hover:text-paper"
        >
          Keep
        </button>
        <button
          type="button"
          onClick={() => void answer("cut")}
          className="min-h-10 flex-1 rounded-full bg-urgent-soft px-4 text-xs font-bold text-urgent transition-colors hover:bg-urgent hover:text-paper dark:hover:text-ink-fixed"
        >
          Cut
        </button>
      </div>
    </section>
  ) : null;
}
