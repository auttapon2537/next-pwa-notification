const CACHE_NAME = "pwa-notify-v1";
const ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/favicon.ico",
];

const defaultNotificationOptions = {
  icon: "/icon-192.png",
  badge: "/icon-192.png",
  lang: "th",
  vibrate: [80, 30, 80],
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(ASSETS);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const network = await fetch(request);
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, network.clone());
          return network;
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallback = await caches.match("/");
          return fallback ?? Response.error();
        }
      })(),
    );
    return;
  }

  if (request.url.startsWith(self.location.origin)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const network = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, network.clone());
        return network;
      })(),
    );
  }
});

self.addEventListener("push", (event) => {
  const payload = safeParsePush(event.data);
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      ...defaultNotificationOptions,
      body: payload.body,
      data: payload.data ?? {},
      timestamp: Date.now(),
      tag: payload.tag ?? "demo-push",
    }),
  );
});

self.addEventListener("message", (event) => {
  const message = event.data;
  if (!message || message.type !== "demo-notification") return;

  const options = {
    ...defaultNotificationOptions,
    tag: message.tag ?? "demo-message",
    data: message.data ?? {},
    ...message.options,
  };

  event.waitUntil(
    self.registration.showNotification(
      message.title || "แจ้งเตือนจาก Service Worker",
      options,
    ),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const payload = event.notification.data || {};
  const targetUrl =
    (event.action && payload.actions?.[event.action]) ||
    payload.url ||
    "/";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        if ("focus" in client) {
          await client.focus();
        }
        if ("navigate" in client && targetUrl) {
          await client.navigate(targetUrl);
        }
        return;
      }

      await self.clients.openWindow(targetUrl);
    })(),
  );
});

function safeParsePush(data) {
  if (!data) {
    return {
      title: "Push Notification",
      body: "ข้อความตัวอย่างจาก service worker",
    };
  }

  try {
    return data.json();
  } catch {
    try {
      return {
        title: "Push Notification",
        body: data.text(),
      };
    } catch {
      return {
        title: "Push Notification",
        body: "ข้อความตัวอย่างจาก service worker",
      };
    }
  }
}
