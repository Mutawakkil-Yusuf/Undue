export interface StorageStatus {
  persisted: boolean;
  supported: boolean;
  usage: number | null;
  quota: number | null;
}

export async function requestPersistentStorage(): Promise<StorageStatus> {
  if (typeof navigator === "undefined" || !navigator.storage) {
    return { persisted: false, supported: false, usage: null, quota: null };
  }

  let persisted = false;
  try {
    persisted = (await navigator.storage.persisted?.()) ?? false;
    if (!persisted && navigator.storage.persist) {
      persisted = await navigator.storage.persist();
    }
  } catch {
    persisted = false;
  }

  let usage: number | null = null;
  let quota: number | null = null;
  try {
    const estimate = await navigator.storage.estimate?.();
    usage = estimate?.usage ?? null;
    quota = estimate?.quota ?? null;
  } catch {
    // Storage estimates are optional.
  }

  return {
    persisted,
    supported: true,
    usage,
    quota,
  };
}
