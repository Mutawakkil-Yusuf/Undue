import { setBackgroundEnabled } from "./ledger";

const SYNC_TAG = "undue-reminders";
const MIN_INTERVAL_MS = 12 * 60 * 60 * 1000;

interface PeriodicSyncManager {
  register(tag: string, options: { minInterval: number }): Promise<void>;
  unregister(tag: string): Promise<void>;
}

type PeriodicRegistration = ServiceWorkerRegistration & {
  periodicSync?: PeriodicSyncManager;
};

/**
 * Turns the best-effort background check on or off.
 *
 * Periodic Background Sync only exists in Chromium browsers, only for installed
 * apps, and the browser decides when it actually runs. Where it is missing the
 * reminders still fire whenever the app is opened, and the calendar export is
 * the dependable way to be reminded with the app closed.
 */
export async function syncBackgroundReminders(enabled: boolean): Promise<boolean> {
  await setBackgroundEnabled(enabled);
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return false;
  }
  try {
    const registration = (await navigator.serviceWorker.getRegistration()) as
      PeriodicRegistration | undefined;
    const manager = registration?.periodicSync;
    if (!manager) {
      return false;
    }
    if (!enabled) {
      await manager.unregister(SYNC_TAG);
      return false;
    }
    const status = await navigator.permissions.query({
      name: "periodic-background-sync" as PermissionName,
    });
    if (status.state !== "granted") {
      return false;
    }
    await manager.register(SYNC_TAG, { minInterval: MIN_INTERVAL_MS });
    return true;
  } catch {
    return false;
  }
}
