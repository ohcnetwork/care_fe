/// <reference lib="webworker" />
// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/modules
// for the list of available Workbox modules, or add any other
// code you'd like.
// You can also remove this file if you'd prefer not to use a
// service worker, and the Workbox build step will be skipped.
import { clientsClaim } from "workbox-core";
import { precacheAndRoute } from "workbox-precaching";

import {
  NOTIFICATION_CLICK_CACHE,
  NOTIFICATION_CLICK_CREATED_HEADER,
  NOTIFICATION_CLICK_HASH_KEY,
  NOTIFICATION_CLICK_MESSAGE,
  NOTIFICATION_CLICK_TTL_MS,
  notificationClickCacheKey,
} from "./lib/notificationClick";

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

// Different events for one resource (low stock, near expiry) must not replace
// each other, while a repeated event still collapses into one notification.
function notificationTag(data: Record<string, unknown>) {
  if (data.external_id) return data.external_id as string;
  if (!data.resource_id) return undefined;
  return [data.event_type, data.resource_id].filter(Boolean).join(":");
}

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
        tag: notificationTag(data),
        data,
      }),
    );
  }
});

// Notification click event listener
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const data = (e.notification.data as Record<string, unknown>) || {};

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

        // Message instead of navigating, so the open page keeps its state
        // (for example an unsaved form). The app decides where to go.
        if (existingClient) {
          let delivered = false;
          try {
            existingClient.postMessage({
              type: NOTIFICATION_CLICK_MESSAGE,
              data,
            });
            delivered = true;
            await existingClient.focus();
          } catch (err) {
            // After delivery the tab already handles the click, so a second
            // window would duplicate it.
            console.warn("Failed to message or focus existing client", err);
          }
          if (delivered) return;
        }

        // A new window cannot receive messages before it loads, so keep the
        // payload in Cache Storage and pass only an opaque id in the hash.
        let targetUrl = "/";
        try {
          const clickId = crypto.randomUUID();
          const cache = await caches.open(NOTIFICATION_CLICK_CACHE);
          // Drop only abandoned entries; a recent one may belong to a click
          // whose window is still opening.
          const now = Date.now();
          await Promise.all(
            (await cache.keys()).map(async (request) => {
              const createdAt = Number(
                (await cache.match(request))?.headers.get(
                  NOTIFICATION_CLICK_CREATED_HEADER,
                ),
              );
              if (!(now - createdAt < NOTIFICATION_CLICK_TTL_MS)) {
                await cache.delete(request);
              }
            }),
          );
          await cache.put(
            notificationClickCacheKey(clickId),
            new Response(JSON.stringify(data), {
              headers: { [NOTIFICATION_CLICK_CREATED_HEADER]: String(now) },
            }),
          );
          targetUrl = `/#${NOTIFICATION_CLICK_HASH_KEY}=${clickId}`;
        } catch (err) {
          console.warn("Failed to stash notification click data", err);
        }

        const windowClient = await self.clients.openWindow(targetUrl);
        await windowClient?.focus();
      })
      .catch((err) => {
        console.warn("Failed to handle notification click", err);
      }),
  );
});
