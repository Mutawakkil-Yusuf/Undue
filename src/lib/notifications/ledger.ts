/**
 * Remembers which reminders were already sent, in the Cache Storage API.
 *
 * Both the page and the service worker can read it (localStorage is invisible
 * to workers), which is what stops a reminder showing twice when the app is
 * opened right after a background check.
 */
const LEDGER_CACHE = "undue-ledger";
const BASE = "/__undue/notified/";
const ENABLED_URL = "/__undue/background-enabled";
const PRUNE_AFTER_DAYS = 60;

function requestFor(key: string): Request {
  return new Request(new URL(`${BASE}${encodeURIComponent(key)}`, location.origin));
}

function cachesAvailable(): boolean {
  return typeof caches !== "undefined";
}

export async function wasNotified(key: string): Promise<boolean> {
  if (!cachesAvailable()) {
    return false;
  }
  try {
    const cache = await caches.open(LEDGER_CACHE);
    return (await cache.match(requestFor(key))) !== undefined;
  } catch {
    return false;
  }
}

export async function markNotified(keys: readonly string[]): Promise<void> {
  if (!cachesAvailable() || keys.length === 0) {
    return;
  }
  try {
    const cache = await caches.open(LEDGER_CACHE);
    await Promise.all(
      keys.map((key) =>
        cache.put(requestFor(key), new Response(new Date().toISOString())),
      ),
    );
    await prune(cache);
  } catch {
    // The worst case is one repeated reminder, which is better than none.
  }
}

/** Keys embed the renewal date; anything renewed long ago can be forgotten. */
async function prune(cache: Cache): Promise<void> {
  const cutoff = Date.now() - PRUNE_AFTER_DAYS * 86_400_000;
  for (const request of await cache.keys()) {
    const path = decodeURIComponent(new URL(request.url).pathname.slice(BASE.length));
    const renewal = path.split("|")[1];
    const time = renewal ? Date.parse(renewal) : Number.NaN;
    if (Number.isFinite(time) && time < cutoff) {
      await cache.delete(request);
    }
  }
}

/** Lets the service worker know whether the user wants background reminders. */
export async function setBackgroundEnabled(enabled: boolean): Promise<void> {
  if (!cachesAvailable()) {
    return;
  }
  try {
    const cache = await caches.open(LEDGER_CACHE);
    const request = new Request(new URL(ENABLED_URL, location.origin));
    if (enabled) {
      await cache.put(request, new Response("1"));
    } else {
      await cache.delete(request);
    }
  } catch {
    // Ignore: foreground reminders still work.
  }
}
