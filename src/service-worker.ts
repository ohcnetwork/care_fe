/// <reference lib="webworker" />
// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/modules
// for the list of available Workbox modules, or add any other
// code you'd like.
// You can also remove this file if you'd prefer not to use a
// service worker, and the Workbox build step will be skipped.
import { clientsClaim } from "workbox-core";
import { precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

clientsClaim();

// This allows the web app to trigger skipWaiting via
// registration.waiting.postMessage({type: 'SKIP_WAITING'})
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Any other custom service worker logic can go here.
self.addEventListener("push", async function (event) {
  if (event.data) {
    const data = JSON.parse(event.data.text());

    if (["PUSH_MESSAGE", "MESSAGE"].includes(data?.type)) {
      self.clients.matchAll().then((clients) => {
        clients[0].postMessage(data);
      });
    } else {
      const title = data.title || "Care - Open Health Care Network";
      const body = data.body || data.message || "";
      event.waitUntil(
        self.registration.showNotification(title, {
          body,
          tag: data.external_id || data.resource_id,
          data,
        }),
      );
    }
  }
});

// Notification click event listener
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const data = (e.notification.data as Record<string, unknown>) || {};
  const facilityId = data.facility_id as string | undefined;
  const fallbackUrl = facilityId
    ? `/facility/${facilityId}/notifications`
    : "/";

  // Encode notification data in URL hash for the FE plugin to resolve on load
  const clickParam = encodeURIComponent(JSON.stringify(data));
  const targetUrl = `${fallbackUrl}#notification_click=${clickParam}`;

  e.waitUntil(
    self.clients.matchAll({ type: "window" }).then(async (clientsArr) => {
      const existingClient = clientsArr.find((client) =>
        client.url.includes(self.location.origin),
      );
      if (existingClient) {
        try {
          await existingClient.navigate(targetUrl);
          return await existingClient.focus();
        } catch {
          // navigate may fail
        }
      }
      return self.clients
        .openWindow(targetUrl)
        .then((windowClient) => (windowClient ? windowClient.focus() : null));
    }),
  );
});
