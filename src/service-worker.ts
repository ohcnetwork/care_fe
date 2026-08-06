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

// Keep this pair in sync with the identical constants in
// care_notifications_fe/src/lib/notificationClickListener.ts — used to hand
// off notification click payloads via Cache Storage instead of the URL, so
// PHI never ends up in the browser history.
const NOTIFICATION_CLICK_CACHE = "care-notification-click-data-v1";
const notificationClickCacheKey = (id: string) =>
  `/__notification_click__/${id}`;

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
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(event.data.text());
  } catch {
    // Malformed payload: still surface something rather than dropping the push silently.
    data = {
      title: "Care - Open Health Care Network",
      body: event.data.text(),
    };
  }

  if (["PUSH_MESSAGE", "MESSAGE"].includes(data?.type as string)) {
    event.waitUntil(
      self.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clients) => {
          clients.forEach((client) => client.postMessage(data));
        }),
    );
  } else {
    const title = (data.title as string) || "Care - Open Health Care Network";
    const body = (data.body as string) || (data.message as string) || "";
    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: "/images/icons/pwa-192x192.png",
        badge: "/images/icons/pwa-192x192.png",
        tag: (data.external_id as string) || (data.resource_id as string),
        data,
      }),
    );
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

  e.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (clientsArr) => {
        const sameOriginClients = clientsArr.filter((client) => {
          try {
            return new URL(client.url).origin === self.location.origin;
          } catch (err) {
            console.warn("Failed to parse client URL", client.url, err);
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
          } catch (err) {
            // Fall back to opening a new window if the matched client closes or
            // becomes unfocusable before the notification click is handled.
            console.warn("Failed to focus existing client", err);
          }
        }

        // Stash the payload in Cache Storage and pass only an opaque id via
        // the hash, so PHI never lands in the URL or browser history.
        let targetUrl = fallbackUrl;
        try {
          const clickId = crypto.randomUUID();
          const cache = await caches.open(NOTIFICATION_CLICK_CACHE);
          await cache.put(
            notificationClickCacheKey(clickId),
            new Response(JSON.stringify(data)),
          );
          targetUrl = `${fallbackUrl}#notification_click=${clickId}`;
        } catch (err) {
          console.warn("Failed to stash notification click data", err);
        }

        // The notifications plugin reads the payload back once it loads in
        // this window, so there's no separate branch to recover into here.
        const windowClient = await self.clients.openWindow(targetUrl);
        await windowClient?.focus();
      })
      .catch((err) => {
        console.warn("Failed to handle notification click", err);
      }),
  );
});
