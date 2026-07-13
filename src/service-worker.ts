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
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (clientsArr) => {
        const sameOriginClients = clientsArr.filter((client) => {
          try {
            return new URL(client.url).origin === self.location.origin;
          } catch {
            return false;
          }
        });
        const existingClient =
          sameOriginClients.find((client) => client.focused) ??
          sameOriginClients.find(
            (client) => client.visibilityState === "visible",
          ) ??
          sameOriginClients[0];

        if (existingClient) {
          // App is already open: focus it and let the page handle navigation.
          // A live page has message listeners ready, unlike a fresh load.
          try {
            const focusedClient = await existingClient.focus();
            focusedClient.postMessage({ type: "NOTIFICATION_CLICK", data });
            return;
          } catch {
            // Fall back to opening a new window if the matched client closes or
            // becomes unfocusable before the notification click is handled.
          }
        }

        const windowClient = await self.clients.openWindow(targetUrl);

        if (windowClient) {
          try {
            await windowClient.focus();
          } catch {
            // Some browsers can reject focus if the new client is no longer active.
          }
        }
      }),
  );
});
