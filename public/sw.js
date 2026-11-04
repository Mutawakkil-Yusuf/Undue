const CACHE_NAME = "undue-v4";
const APP_SHELL = "/app";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll([APP_SHELL, "/manifest.webmanifest", "/icon.svg"]))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname === "/sw.js") {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);

        // Only cache successful, same-origin responses. Caching a 404 or 500
        // would make a transient failure look permanent while offline.
        if (response.ok && response.type === "basic") {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }

        return response;
      } catch {
        const cached = await caches.match(request);
        if (cached) {
          return cached;
        }

        if (request.mode === "navigate") {
          const shell = await caches.match(APP_SHELL);
          if (shell) {
            return shell;
          }
        }

        return new Response("Offline and not cached", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || APP_SHELL, self.location.origin);
  const subscriptionId = event.notification.data?.subscriptionId;
  if (
    (event.action === "keep" || event.action === "cut") &&
    typeof subscriptionId === "string" &&
    subscriptionId
  ) {
    url.searchParams.set("decision", event.action);
    url.searchParams.set("id", subscriptionId);
  }
  const target = url.href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of windows) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) {
            await client.navigate(target);
          }
          return;
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow(target);
      }
    })(),
  );
});
