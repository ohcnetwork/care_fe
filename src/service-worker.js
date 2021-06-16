import { precacheAndRoute } from "workbox-precaching/precacheAndRoute";

precacheAndRoute(self.__WB_MANIFEST);

console.log("In custom service worker");
self.addEventListener("push", async function (event) {
  event.waitUntil(
    self.registration.showNotification("Care - CoronaSafe", {
      body: "title",
    })
  );
});

// Notification click event listener
self.addEventListener("notificationclick", (e) => {
  // !!! For testing, remove in production !!!
  const t_id = "dba42af0-9c23-405c-84bd-4d2229d5b4b8";

  console.log("on notification click");
  // Close the notification popout
  e.notification.close();
  // Get all the Window clients
  e.waitUntil(
    clients.matchAll({ type: "window" }).then((clientsArr) => {
      // If a Window tab matching the targeted URL already exists, focus that;
      const hadWindowToFocus = clientsArr.some((windowClient) =>
        windowClient.url === "/show_notification/".concat(t_id)
          ? (windowClient.focus(), true)
          : false
      );
      // Otherwise, open a new tab to the applicable URL and focus it.
      if (!hadWindowToFocus)
        clients
          .openWindow("/show_notification/".concat(t_id))
          .then((windowClient) => (windowClient ? windowClient.focus() : null));
    })
  );
});
