export const NOTIFICATIONS_STORAGE_KEY = "undue-notifications";
export const LAST_NOTIFIED_STORAGE_KEY = "undue-last-notified";
export const NOTIFIED_EVENTS_STORAGE_KEY = "undue-notified-events";
export const DEFAULT_NOTIFICATION_TIME = "08:00";

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!notificationsSupported()) {
    return "denied";
  }
  return window.Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) {
    return "denied";
  }
  try {
    return await window.Notification.requestPermission();
  } catch {
    return "denied";
  }
}

export function readNotificationsEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return window.localStorage.getItem(NOTIFICATIONS_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setNotificationsEnabled(enabled: boolean): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // Ignore storage failures; the toggle still reflects in-memory state.
  }
  emit();
}

export function subscribeNotifications(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function getNotificationsSnapshot(): boolean {
  return readNotificationsEnabled();
}

export function getServerNotificationsSnapshot(): boolean {
  return false;
}

export function readLastNotified(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage.getItem(LAST_NOTIFIED_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function markNotified(dayKey: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(LAST_NOTIFIED_STORAGE_KEY, dayKey);
  } catch {
    // Ignore.
  }
}

export function readNotifiedEvents(): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(NOTIFIED_EVENTS_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function markNotifiedEvents(keys: readonly string[], at: string): void {
  if (typeof window === "undefined" || keys.length === 0) {
    return;
  }
  try {
    const current = readNotifiedEvents();
    for (const key of keys) {
      current[key] = at;
    }
    window.localStorage.setItem(NOTIFIED_EVENTS_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Ignore storage failures.
  }
}

export function notificationTimeParts(value: string): { hours: number; minutes: number } {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) {
    return { hours: 8, minutes: 0 };
  }
  return { hours: Number(match[1]), minutes: Number(match[2]) };
}

export function isAtOrAfterNotificationTime(
  clock: Date,
  notificationTime: string,
): boolean {
  const { hours, minutes } = notificationTimeParts(notificationTime);
  const target = new Date(clock);
  target.setHours(hours, minutes, 0, 0);
  return clock.getTime() >= target.getTime();
}

export function notificationTriggersSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "TimestampTrigger" in window
  );
}

export interface TimestampTriggerConstructor {
  new (timestamp: number): unknown;
}

export function getTimestampTriggerConstructor(): TimestampTriggerConstructor | null {
  if (typeof window === "undefined") {
    return null;
  }
  const constructor = (window as unknown as { TimestampTrigger?: unknown })
    .TimestampTrigger;
  return typeof constructor === "function"
    ? (constructor as TimestampTriggerConstructor)
    : null;
}
