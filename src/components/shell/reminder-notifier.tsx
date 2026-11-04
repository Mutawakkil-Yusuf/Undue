"use client";

import { useEffect } from "react";
import { useSubscriptions, useSettings } from "@/lib/db/hooks";
import { notificationTimeOf } from "@/lib/db/settings";
import { computeCancelWindow } from "@/lib/domain/cancel-by";
import { todayIso } from "@/lib/domain/date";
import { useNotificationsEnabled } from "@/lib/hooks/use-notifications";
import { useToday } from "@/lib/hooks/use-today";
import {
  getNotificationPermission,
  isAtOrAfterNotificationTime,
  markNotified,
  markNotifiedEvents,
  notificationsSupported,
  readLastNotified,
  readNotifiedEvents,
} from "@/lib/notifications/notifications";

interface ReminderCandidate {
  key: string;
  priority: number;
  name: string;
  kind: "today" | "urgent" | "missed" | "soon" | "trial";
}

export function ReminderNotifier() {
  const subscriptions = useSubscriptions();
  const settings = useSettings();
  const today = useToday();
  const enabled = useNotificationsEnabled();
  const notificationTime = notificationTimeOf(settings);

  useEffect(() => {
    if (!enabled || !today || !subscriptions) {
      return;
    }
    if (!notificationsSupported() || getNotificationPermission() !== "granted") {
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
            kind: "trial",
          });
        }
      } else if (window.urgency === "today") {
        const key = `${base}:today:${dayKey}`;
        if (!notified[key]) {
          candidates.push({ key, priority: 0, name: subscription.name, kind: "today" });
        }
      } else if (window.urgency === "urgent") {
        const key = `${base}:urgent:${dayKey}`;
        if (!notified[key]) {
          candidates.push({
            key,
            priority: 1,
            name: subscription.name,
            kind: "urgent",
          });
        }
      } else if (window.urgency === "soon") {
        const key = `${base}:soon`;
        if (!notified[key]) {
          candidates.push({ key, priority: 3, name: subscription.name, kind: "soon" });
        }
      } else if (window.urgency === "missed") {
        const key = `${base}:missed`;
        if (!notified[key]) {
          candidates.push({
            key,
            priority: 2,
            name: subscription.name,
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

    const show = async () => {
      const options = {
        body,
        tag: "undue-reminders",
        data: { url: "/app" },
      };
      try {
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            await registration.showNotification(title, options);
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
  }, [enabled, notificationTime, subscriptions, today]);

  return null;
}
