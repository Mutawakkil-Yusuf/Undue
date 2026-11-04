"use client";

import { useEffect } from "react";
import { useSettings, useSubscriptions } from "@/lib/db/hooks";
import { notificationTimeOf } from "@/lib/db/settings";
import { advance } from "@/lib/domain/cycle";
import { computeCancelWindow } from "@/lib/domain/cancel-by";
import { addDays, parseIsoDate } from "@/lib/domain/date";
import { getBillingDay } from "@/lib/domain/subscription";
import { useNotificationsEnabled } from "@/lib/hooks/use-notifications";
import {
  getNotificationPermission,
  getTimestampTriggerConstructor,
  notificationTimeParts,
  notificationsSupported,
} from "@/lib/notifications/notifications";

const TAG_PREFIX = "undue-scheduled-";
const DAYS_TO_SCHEDULE = 3;

function atNotificationTime(date: Date, notificationTime: string): Date {
  const { hours, minutes } = notificationTimeParts(notificationTime);
  // `date` is a UTC civil date (midnight UTC). Build the local timestamp from
  // its calendar parts so users west of UTC do not get the reminder a day early.
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    hours,
    minutes,
    0,
    0,
  );
}

async function clearScheduled(registration: ServiceWorkerRegistration): Promise<void> {
  try {
    const notifications = await registration.getNotifications();
    for (const notification of notifications) {
      if (notification.tag.startsWith(TAG_PREFIX)) {
        notification.close();
      }
    }
  } catch {
    // Older browsers may not expose scheduled notifications.
  }
}

export function NotificationScheduler() {
  const subscriptions = useSubscriptions();
  const settings = useSettings();
  const enabled = useNotificationsEnabled();
  const notificationTime = notificationTimeOf(settings);

  useEffect(() => {
    if (!notificationsSupported() || !("serviceWorker" in navigator)) {
      return;
    }
    if (getNotificationPermission() !== "granted") {
      return;
    }

    const trigger = getTimestampTriggerConstructor();
    if (!trigger) {
      return;
    }
    const Trigger = trigger;

    let cancelled = false;

    async function schedule() {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        return;
      }
      await clearScheduled(registration);
      if (cancelled || !enabled || !subscriptions) {
        return;
      }

      const now = new Date();
      const triggerAt = (date: Date) => {
        const timestamp = atNotificationTime(date, notificationTime).getTime();
        return timestamp > now.getTime() + 60_000 ? timestamp : null;
      };

      for (const subscription of subscriptions) {
        if (subscription.status !== "active") {
          continue;
        }
        const window = computeCancelWindow(subscription, now);
        let renewal = parseIsoDate(window.renewal);
        const billingDay = getBillingDay(subscription);
        const occurrences = subscription.isTrial ? 1 : DAYS_TO_SCHEDULE;

        for (let index = 0; index < occurrences; index += 1) {
          const cancelBy = addDays(renewal, -subscription.leadDays);
          const lastDay = triggerAt(cancelBy);
          if (lastDay) {
            const tag = `${TAG_PREFIX}${subscription.id}-${index}-last`;
            try {
              await registration.showNotification(
                `Last day to cancel ${subscription.name}`,
                {
                  body: "Today is the last safe day to cancel before the next charge.",
                  tag,
                  data: { url: "/app" },
                  showTrigger: new Trigger(lastDay),
                } as NotificationOptions & { showTrigger: unknown },
              );
            } catch {
              // A browser can reject a trigger after permission changes.
            }
          }

          const soonDate = addDays(cancelBy, -3);
          const soon = triggerAt(soonDate);
          if (soon && soon !== lastDay) {
            const tag = `${TAG_PREFIX}${subscription.id}-${index}-soon`;
            try {
              await registration.showNotification(
                `${subscription.name}'s cancel window is open`,
                {
                  body: "You have a few days left to cancel before the next charge.",
                  tag,
                  data: { url: "/app" },
                  showTrigger: new Trigger(soon),
                } as NotificationOptions & { showTrigger: unknown },
              );
            } catch {
              // Ignore unsupported scheduling.
            }
          }

          renewal = advance(renewal, subscription.cycle, billingDay);
        }
      }
    }

    void schedule();

    return () => {
      cancelled = true;
    };
  }, [enabled, notificationTime, subscriptions]);

  return null;
}
