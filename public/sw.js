/* Undue service worker.
 *
 * - Offline: hashed build assets are cache-first, everything else network-first
 *   with a cached fallback, so a new deploy is always picked up when online.
 * - Reminders: shows notifications, and (Chromium installed apps only) checks
 *   for closing cancel windows on a periodic background sync.
 *
 * The reminder rules below mirror src/lib/domain/reminders.ts. A test
 * (src/lib/domain/reminders-sw-parity.test.ts) runs both on the same data so
 * they cannot drift apart.
 */
const CACHE_NAME = "undue-v4";
const LEDGER_CACHE = "undue-ledger";
const KEEP_CACHES = [CACHE_NAME, LEDGER_CACHE];
const SYNC_TAG = "undue-reminders";
const DEFAULT_REMINDER_HOUR = 9;
const ICON = "/icons/icon-192.png";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => !KEEP_CACHES.includes(key)).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

function isCacheable(response) {
  return response && response.ok && response.status === 200 && response.type === "basic";
}

async function remember(request, response) {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response);
  } catch {
    // Quota or an unsupported response; the network result is still returned.
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/__undue/")) {
    return;
  }

  const isImmutable =
    url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/");

  event.respondWith(
    (async () => {
      if (isImmutable) {
        const cached = await caches.match(request);
        if (cached) {
          return cached;
        }
      }
      try {
        const response = await fetch(request);
        if (isCacheable(response)) {
          event.waitUntil(remember(request, response.clone()));
        }
        return response;
      } catch (error) {
        const cached = await caches.match(request);
        if (cached) {
          return cached;
        }
        if (request.mode === "navigate") {
          const shell = await caches.match("/app");
          if (shell) {
            return shell;
          }
        }
        throw error;
      }
    })(),
  );
});

/* ---------- Reminders ---------- */

const DAY_MS = 86_400_000;

function civilDay(date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseIso(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function formatShort(iso) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })
    .format(new Date(parseIso(iso)))
    .replace(",", "");
}

function dayWord(days) {
  return days === 1 ? "1 day" : days + " days";
}

function reminderFor(subscription, clock) {
  if (subscription.status !== "active") {
    return null;
  }
  const today = civilDay(clock);
  const renewal = parseIso(subscription.nextRenewal);
  const cancelBy = renewal - subscription.leadDays * DAY_MS;
  const daysUntilRenewal = Math.round((renewal - today) / DAY_MS);
  const daysUntilCancelBy = Math.round((cancelBy - today) / DAY_MS);

  let stage = null;
  if (daysUntilRenewal < 0) {
    stage = null;
  } else if (daysUntilCancelBy < 0) {
    stage = "missed";
  } else if (daysUntilCancelBy === 0) {
    stage = "today";
  } else if (daysUntilCancelBy <= 2) {
    stage = "urgent";
  } else if (daysUntilCancelBy <= 7 && subscription.isTrial) {
    stage = "soon";
  }
  if (stage === null) {
    return null;
  }

  const name = subscription.name;
  const renews = formatShort(subscription.nextRenewal);
  const trial = subscription.isTrial;
  let title;
  let body;
  if (stage === "today") {
    title = trial ? "Cancel the " + name + " trial today" : "Cancel " + name + " today";
    body = trial
      ? "Today is the last safe day before the free trial turns into a paid plan on " +
        renews +
        "."
      : "Today is the last safe day to cancel before it renews on " + renews + ".";
  } else if (stage === "urgent") {
    title = name + ": " + dayWord(daysUntilCancelBy) + " left to cancel";
    body = trial
      ? "The free trial converts to a paid plan on " + renews + "."
      : "It renews on " + renews + ".";
  } else if (stage === "soon") {
    title = name + " trial converts in " + dayWord(daysUntilCancelBy);
    body = "You will be charged on " + renews + " unless you cancel first.";
  } else {
    title = name + ": the cancel window has passed";
    body = "It renews on " + renews + ". Check with the provider if you still want out.";
  }

  return {
    key: subscription.id + "|" + subscription.nextRenewal + "|" + stage,
    subscriptionId: subscription.id,
    name: name,
    stage: stage,
    title: title,
    body: body,
  };
}

function selectReminders(subscriptions, clock) {
  const result = [];
  for (const subscription of subscriptions) {
    const reminder = reminderFor(subscription, clock);
    if (reminder) {
      result.push(reminder);
    }
  }
  return result;
}

function toNotification(reminders) {
  if (reminders.length === 0) {
    return null;
  }
  if (reminders.length === 1) {
    const only = reminders[0];
    return { title: only.title, body: only.body, tag: "undue-" + only.subscriptionId };
  }
  const names = reminders.slice(0, 3).map((reminder) => reminder.name);
  const extra = reminders.length - names.length;
  return {
    title: reminders.length + " subscriptions need attention",
    body: names.join(", ") + (extra > 0 ? " and " + extra + " more" : "") + ".",
    tag: "undue-reminders",
  };
}

// Exposed for the parity test only.
self.__undueReminders = { selectReminders: selectReminders, toNotification: toNotification };

function readStore(storeName, key) {
  return new Promise((resolve) => {
    let opened;
    try {
      opened = indexedDB.open("undue");
    } catch {
      resolve(undefined);
      return;
    }
    opened.onerror = () => resolve(undefined);
    opened.onsuccess = () => {
      const database = opened.result;
      if (!database.objectStoreNames.contains(storeName)) {
        database.close();
        resolve(undefined);
        return;
      }
      const request = database.transaction(storeName, "readonly").objectStore(storeName);
      const read = key === undefined ? request.getAll() : request.get(key);
      read.onsuccess = () => {
        database.close();
        resolve(read.result);
      };
      read.onerror = () => {
        database.close();
        resolve(undefined);
      };
    };
  });
}

function ledgerRequest(key) {
  return new Request(
    new URL("/__undue/notified/" + encodeURIComponent(key), self.location.origin),
  );
}

async function checkReminders() {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    return;
  }
  const ledger = await caches.open(LEDGER_CACHE);
  const enabled = await ledger.match(
    new URL("/__undue/background-enabled", self.location.origin),
  );
  if (!enabled) {
    return;
  }

  const settings = await readStore("settings", "app");
  const hour =
    settings && typeof settings.reminderHour === "number"
      ? settings.reminderHour
      : DEFAULT_REMINDER_HOUR;
  const now = new Date();
  if (now.getHours() < hour) {
    return;
  }

  const subscriptions = (await readStore("subscriptions")) || [];
  const fresh = [];
  for (const reminder of selectReminders(subscriptions, now)) {
    if (!(await ledger.match(ledgerRequest(reminder.key)))) {
      fresh.push(reminder);
    }
  }
  const notification = toNotification(fresh);
  if (!notification) {
    return;
  }

  await self.registration.showNotification(notification.title, {
    body: notification.body,
    tag: notification.tag,
    icon: ICON,
    badge: ICON,
    data: { url: "/app" },
  });
  await Promise.all(
    fresh.map((reminder) =>
      ledger.put(ledgerRequest(reminder.key), new Response(now.toISOString())),
    ),
  );
}

self.addEventListener("periodicsync", (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(checkReminders().catch(() => undefined));
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/app";
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin && "focus" in client) {
          await client.focus();
          if ("navigate" in client) {
            await client.navigate(target).catch(() => undefined);
          }
          return;
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});
