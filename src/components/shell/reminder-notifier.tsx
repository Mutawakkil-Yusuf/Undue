"use client";

import { useEffect } from "react";
import { useSubscriptions } from "@/lib/db/hooks";
import { computeCancelWindow } from "@/lib/domain/cancel-by";
import { todayIso } from "@/lib/domain/date";
import { useNotificationsEnabled } from "@/lib/hooks/use-notifications";
import { useToday } from "@/lib/hooks/use-today";
import {
  getNotificationPermission,
  markNotified,
  notificationsSupported,
  readLastNotified,
} from "@/lib/notifications/notifications";

export function ReminderNotifier() {
  const subscriptions = useSubscriptions();
  const today = useToday();
  const enabled = useNotificationsEnabled();

  useEffect(() => {
    if (!enabled || !today || !subscriptions) {
      return;
    }
    if (!notificationsSupported() || getNotificationPermission() !== "granted") {
      return;
    }

    const dayKey = todayIso(today);
    if (readLastNotified() === dayKey) {
      return;
    }

    const due = subscriptions.filter((subscription) => {
      if (subscription.status !== "active") {
        return false;
      }
      const { urgency } = computeCancelWindow(subscription, today);
      return urgency === "today" || urgency === "urgent" || urgency === "missed";
    });

    if (due.length === 0) {
      return;
    }

    const first = due[0];
    try {
      new Notification(
        due.length === 1 && first
          ? `Cancel ${first.name} today`
          : `${due.length} subscriptions need attention`,
        {
          body:
            due.length === 1
              ? "Today is the last safe day to cancel before you're charged."
              : "The cancel window is closing on several subscriptions.",
          tag: "undue-reminders",
        },
      );
      markNotified(dayKey);
    } catch {
      // Notifications can throw when permission is missing; ignore.
    }
  }, [enabled, today, subscriptions]);

  return null;
}
