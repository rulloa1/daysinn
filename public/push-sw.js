/* Housekeeping web-push messaging worker.
   Push/notification handling only — no fetch handler, no app-shell caching. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Days Inn housekeeping", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "Days Inn housekeeping";
  const options = {
    body: payload.body || "",
    tag: payload.tag || "housekeeping",
    icon: "/favicon.png",
    badge: "/favicon.png",
    data: { url: payload.url || "/housekeeping" },
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/housekeeping";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(target) && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(target);
    }),
  );
});
