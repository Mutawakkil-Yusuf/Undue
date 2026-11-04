export const APP_DATA_STORAGE_KEYS = [
  "undue-onboarded",
  "undue-notifications",
  "undue-last-notified",
  "undue-notified-events",
  "undue-prompted-decision-events",
] as const;

/** Clear device-local app state that is not stored in IndexedDB. */
export function clearAppStorage(): void {
  if (typeof window === "undefined") {
    return;
  }
  for (const key of APP_DATA_STORAGE_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage failures; database erasure still succeeded.
    }
  }
}
