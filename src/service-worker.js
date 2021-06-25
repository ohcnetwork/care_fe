import { precacheAndRoute } from "workbox-precaching/precacheAndRoute";

precacheAndRoute(self.__WB_MANIFEST);

console.log("In custom service worker");
self.addEventListener("push", async function (event) {
  const data = JSON.parse(event.data.text());

  event.waitUntil(
    self.registration.showNotification("Care - CoronaSafe Network", {
      body: data.title,
      tag: data.external_id,
    })
  );
});

// Notification click event listener
self.addEventListener("notificationclick", (e) => {
  console.log("on notification click");
  // Close the notification popout
  e.notification.close();
  // Get all the Window clients
  e.waitUntil(
    clients.matchAll({ type: "window" }).then((clientsArr) => {
      // If a Window tab matching the targeted URL already exists, focus that;
      const hadWindowToFocus = clientsArr.some((windowClient) =>
        windowClient.url === "/notifications/".concat(e.notification.tag)
          ? (windowClient.focus(), true)
          : false
      );
      // Otherwise, open a new tab to the applicable URL and focus it.
      if (!hadWindowToFocus)
        clients
          .openWindow("/notifications/".concat(e.notification.tag))
          .then((windowClient) => (windowClient ? windowClient.focus() : null));
    })
  );
});
