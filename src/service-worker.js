console.log("In custom service worker");
self.addEventListener("push", function (event) {
  console.log("[Service Worker] Push Received.");
  console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);
  const title = "Push Codelab";
  const options = {
    body: "Yay it works.",
    icon: "images/icon.png",
    badge: "images/badge.png",
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

/*
self.addEventListener("push", function(event) {
  var json = event.data.json();
  self.registration.showNotification(json.title, {
    body: json.body,
    icon: json.icon
  });
});
*/
