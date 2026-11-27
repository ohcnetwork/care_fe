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
 * loads later (plugins load after sign-in) reads and clears that property, then
 * listens for the event. A click that nobody takes is dropped by core, see
 * `NOTIFICATION_CLICK_PENDING_MS`.
 */

export const NOTIFICATION_CLICK_CACHE = "care-notification-click-v1";
export const NOTIFICATION_CLICK_MESSAGE = "NOTIFICATION_CLICK";
export const NOTIFICATION_CLICK_EVENT = "care:notification-click";
export const NOTIFICATION_CLICK_HASH_KEY = "notification_click";
export const NOTIFICATION_CLICK_CREATED_HEADER = "x-created-at";
/** A stored payload that no window consumed within this time is abandoned. */
export const NOTIFICATION_CLICK_TTL_MS = 10 * 60 * 1000;

/**
 * Once a user is signed in, a click that no plugin listener takes in this
 * time is dropped, so a later page that mounts a listener does not jump to an
 * old target.
 */
export const NOTIFICATION_CLICK_PENDING_MS = 30 * 1000;

/**
 * Plugins load only after sign-in, so a click made while signed out waits for
 * the sign-in, so the user lands on its page. It is dropped after this time,
 * so a different user who signs in later does not inherit it.
 */
export const NOTIFICATION_CLICK_SIGNED_OUT_MAX_MS = 5 * 60 * 1000;

export const notificationClickCacheKey = (id: string) =>
  `/__notification_click__/${id}`;
