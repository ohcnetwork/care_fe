/// <reference lib="webworker" />
// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/modules
// for the list of available Workbox modules, or add any other
// code you'd like.
// You can also remove this file if you'd prefer not to use a
// service worker, and the Workbox build step will be skipped.
import { clientsClaim } from "workbox-core";
import { ExpirationPlugin } from "workbox-expiration";
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";

declare const self: ServiceWorkerGlobalScope;

const precacheFiles = self.__WB_MANIFEST || [];

clientsClaim();
console.log(precacheFiles, precacheAndRoute);
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
      event.waitUntil(
        self.registration.showNotification("Care - Open Health Care Network", {
          body: data.message,
          tag: data.external_id,
        }),
      );
    }
  }
});

// Notification click event listener
self.addEventListener("notificationclick", (e) => {
  // Close the notification popout
  e.notification.close();
  // Get all the Window clients
  e.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientsArr) => {
      // If a Window tab matching the targeted URL already exists, focus that;
      const hadWindowToFocus = clientsArr.some((windowClient) =>
        windowClient.url === "/notifications/".concat(e.notification.tag)
          ? (windowClient.focus(), true)
          : false,
      );
      // Otherwise, open a new tab to the applicable URL and focus it.
      if (!hadWindowToFocus)
        self.clients
          .openWindow("/notifications/".concat(e.notification.tag))
          .then((windowClient) => (windowClient ? windowClient.focus() : null));
    }),
  );
});
// registerRoute(
//   new NavigationRoute(async ({ request }) => {
//     const cachedResponse = await caches.match("/index.html");
//     if (cachedResponse) {
//       return cachedResponse;
//     }

//     try {
//       return await fetch(request);
//     } catch {
//       return new Response("Offline and no cached version available.", {
//         status: 503,
//         headers: { "Content-Type": "text/html" },
//       });
//     }
//   }),
// );

registerRoute(
  ({ request }) =>
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image",
  new NetworkFirst({
    cacheName: "static-assets",
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  }),
);

registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkFirst({
    cacheName: "html-cache-1",
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 7 * 24 * 60 * 120, // 1 week
      }),
    ],
  }),
);
