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

// Keep in sync with the identical constants in
// care_notifications_fe/src/lib/notificationClickListener.ts.
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

  const fallbackTitle = import.meta.env.REACT_APP_TITLE || "CARE";
  const fallbackData = { title: fallbackTitle, body: event.data.text() };
  let data: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(event.data.text());
    // Reject non-object JSON (null, arrays, primitives) before any property access below.
    data =
      parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : fallbackData;
  } catch {
    // Malformed payload: still surface something rather than dropping the push silently.
    data = fallbackData;
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
    const title = (data.title as string) || fallbackTitle;
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
            console.warn(
              "Failed to parse client URL for same-origin check",
              err,
            );
            return false;
          }
        });
        const existingClient =
          sameOriginClients.find((client) => client.focused) ??
          sameOriginClients.find(
            (client) => client.visibilityState === "visible",
          ) ??
          sameOriginClients[0];

        // Stash the payload in Cache Storage and pass only an opaque id via
        // the hash, so PHI never lands in the URL or browser history —
        // postMessage-ing an open client instead can race its listener mount.
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

        if (existingClient) {
          try {
            const navigatedClient = await existingClient.navigate(targetUrl);
            await navigatedClient?.focus();
            return;
          } catch (err) {
            // navigate() may be unsupported, or the client closed mid-navigation.
            console.warn(
              "Failed to navigate existing client, opening a new window instead",
              err,
            );
          }
        }

        // The notifications plugin reads the payload back once this window loads.
        const windowClient = await self.clients.openWindow(targetUrl);
        await windowClient?.focus();
      })
      .catch((err) => {
        console.warn("Failed to handle notification click", err);
      }),
  );
});
