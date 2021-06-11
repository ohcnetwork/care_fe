import { precacheAndRoute } from "workbox-precaching/precacheAndRoute";
import { axios } from "axios";

precacheAndRoute(self.__WB_MANIFEST);

console.log("In custom service worker");
self.addEventListener("push", function (event) {
  console.log(event);
  const data = JSON.parse(event.data);

  const res = axios.get(`/api/v1/notification/${data.external_id}/`);
  console.log(res);

  event.waitUntil(
    self.registration.showNotification("Care - CoronaSafe", {
      body: data.title,
    })
  );
});

/*
  const options = {
    body: "Yay it works.",
    icon: "images/icon.png",
    badge: "images/badge.png",
  };

self.addEventListener("push", function(event) {
  var json = event.data.json();
  self.registration.showNotification(json.title, {
    body: json.body,
    icon: json.icon
  });
});
*/
