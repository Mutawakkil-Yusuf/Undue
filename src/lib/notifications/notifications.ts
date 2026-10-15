export const NOTIFICATIONS_STORAGE_KEY = "undue-notifications";
export const LAST_NOTIFIED_STORAGE_KEY = "undue-last-notified";

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
