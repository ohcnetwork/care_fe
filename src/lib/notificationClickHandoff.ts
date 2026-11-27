import { LocalStorageKeys } from "@/common/constants";

import {
  NOTIFICATION_CLICK_CACHE,
  NOTIFICATION_CLICK_EVENT,
  NOTIFICATION_CLICK_HASH_KEY,
  NOTIFICATION_CLICK_MESSAGE,
  NOTIFICATION_CLICK_PENDING_MS,
  NOTIFICATION_CLICK_SIGNED_OUT_MAX_MS,
  notificationClickCacheKey,
} from "./notificationClick";

/** The page side of the notification click handoff. See `./notificationClick`. */

declare global {
  interface Window {
    __CARE_PENDING_NOTIFICATION_CLICK__?: Record<string, unknown> | null;
  }
}

let pendingExpiry: ReturnType<typeof setTimeout> | undefined;

function expirePendingClick(data: Record<string, unknown>) {
  const publishedAt = Date.now();
  let signedInAt: number | null = null;

  const check = () => {
    if (window.__CARE_PENDING_NOTIFICATION_CLICK__ !== data) return;
    const now = Date.now();
    if (
      signedInAt === null &&
      localStorage.getItem(LocalStorageKeys.accessToken)
    ) {
      signedInAt = now;
    }
    const expired =
      signedInAt !== null
        ? now - signedInAt >= NOTIFICATION_CLICK_PENDING_MS
        : now - publishedAt >= NOTIFICATION_CLICK_SIGNED_OUT_MAX_MS;
    if (expired) {
      window.__CARE_PENDING_NOTIFICATION_CLICK__ = null;
      return;
    }
    pendingExpiry = setTimeout(check, 1000);
  };

  clearTimeout(pendingExpiry);
  check();
}

function publishNotificationClick(data: Record<string, unknown>) {
  window.__CARE_PENDING_NOTIFICATION_CLICK__ = data;
  expirePendingClick(data);
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
