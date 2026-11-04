const LAST_BACKUP_KEY = "undue-last-backup";
const NUDGE_SNOOZE_KEY = "undue-backup-nudge-snoozed-until";
const STALE_AFTER_DAYS = 30;
const SNOOZE_DAYS = 7;

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode or full storage: the nudge just keeps showing.
  }
}

export function getLastBackupAt(): string | null {
  return read(LAST_BACKUP_KEY);
}

const CHANGE_EVENT = "undue-backup-state";

export function recordBackup(date: Date = new Date()): void {
  write(LAST_BACKUP_KEY, date.toISOString());
  notifyChange();
}

function notifyChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

/** For useSyncExternalStore: re-reads backup state when it changes in this tab. */
export function subscribeBackupState(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Pure rule for the dashboard nudge, kept separate so it can be tested. */
export function shouldNudgeBackup(input: {
  subscriptionCount: number;
  lastBackupAt: string | null;
  snoozedUntil: string | null;
  now: Date;
}): boolean {
  if (input.subscriptionCount < 3) {
    return false;
  }
  if (input.snoozedUntil && Date.parse(input.snoozedUntil) > input.now.getTime()) {
    return false;
  }
  if (!input.lastBackupAt) {
    return true;
  }
  const ageDays = (input.now.getTime() - Date.parse(input.lastBackupAt)) / 86_400_000;
  return Number.isNaN(ageDays) || ageDays >= STALE_AFTER_DAYS;
}

export function getBackupNudgeState(now: Date, subscriptionCount: number): boolean {
  return shouldNudgeBackup({
    subscriptionCount,
    lastBackupAt: getLastBackupAt(),
    snoozedUntil: read(NUDGE_SNOOZE_KEY),
    now,
  });
}

export function snoozeBackupNudge(now: Date = new Date()): void {
  write(
    NUDGE_SNOOZE_KEY,
    new Date(now.getTime() + SNOOZE_DAYS * 86_400_000).toISOString(),
  );
  notifyChange();
}

/**
 * Asks the browser not to evict this site's data under storage pressure.
 * Best effort: it can be declined, and not every browser supports it.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (typeof navigator === "undefined" || !navigator.storage?.persist) {
      return false;
    }
    if (await navigator.storage.persisted()) {
      return true;
    }
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
