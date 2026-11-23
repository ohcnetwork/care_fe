/**
 * Hands the data of a clicked push notification from the service worker to
 * the app, so plugins can decide where to navigate. Core does not interpret
 * the payload.
 *
 * - An open window gets a `NOTIFICATION_CLICK` message.
 * - A new window opens at `/#notification_click=<id>`. The payload waits in
 *   Cache Storage under `<id>`, so it never appears in the URL or in history.
 *
 * Either way, the page dispatches `NOTIFICATION_CLICK_EVENT` on `window` and
 * keeps the data in `window.__CARE_PENDING_NOTIFICATION_CLICK__`. A plugin that
 * loads later reads and clears that property, then listens for the event.
 */

export const NOTIFICATION_CLICK_CACHE = "care-notification-click-v1";
export const NOTIFICATION_CLICK_MESSAGE = "NOTIFICATION_CLICK";
export const NOTIFICATION_CLICK_EVENT = "care:notification-click";
export const NOTIFICATION_CLICK_HASH_KEY = "notification_click";
export const NOTIFICATION_CLICK_CREATED_HEADER = "x-created-at";
/** A stored payload that no window consumed within this time is abandoned. */
export const NOTIFICATION_CLICK_TTL_MS = 10 * 60 * 1000;

export const notificationClickCacheKey = (id: string) =>
  `/__notification_click__/${id}`;

declare global {
  interface Window {
    __CARE_PENDING_NOTIFICATION_CLICK__?: Record<string, unknown> | null;
  }
}

function publishNotificationClick(data: Record<string, unknown>) {
  window.__CARE_PENDING_NOTIFICATION_CLICK__ = data;
  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_CLICK_EVENT, { detail: data }),
  );
}

async function consumeCachedNotificationClick(id: string) {
  const cache = await caches.open(NOTIFICATION_CLICK_CACHE);
  const key = notificationClickCacheKey(id);
  const response = await cache.match(key);
  if (!response) return null;
  await cache.delete(key);
  return (await response.json()) as Record<string, unknown>;
}

async function handleNotificationClickHash() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const id = params.get(NOTIFICATION_CLICK_HASH_KEY);
  if (!id) return;

  // Clear the hash right away so a refresh does not replay the click.
  params.delete(NOTIFICATION_CLICK_HASH_KEY);
  const remainingHash = params.toString();
  window.history.replaceState(
    window.history.state,
    "",
    window.location.pathname +
      window.location.search +
      (remainingHash ? `#${remainingHash}` : ""),
  );

  try {
    const data = await consumeCachedNotificationClick(id);
    if (data) publishNotificationClick(data);
  } catch (err) {
    console.warn("Failed to read notification click data", err);
  }
}

export function initNotificationClickHandoff() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type !== NOTIFICATION_CLICK_MESSAGE) return;
      publishNotificationClick(event.data.data ?? {});
    });
  }
  void handleNotificationClickHash();
}
