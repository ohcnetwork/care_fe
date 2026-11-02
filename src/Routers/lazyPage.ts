import { ComponentType, lazy, LazyExoticComponent } from "react";

const RELOAD_AT_KEY = "care-stale-chunk-reload-at";

// A reload that happened within this window did not fix the failing chunk, so
// a second failure surfaces the error page instead of reloading again.
const RELOAD_GUARD_MS = 5 * 60 * 1000;

let isReloading = false;

/**
 * Reloads the page so that it picks up the current deploy after a lazily
 * loaded chunk failed to load (usually because a deploy removed the hashed
 * file that this page still points to).
 *
 * The service worker precaches every chunk of the build it installed, so this
 * mostly matters for tabs left open while another tab applied an update
 * (which clears the caches and unregisters the worker), and for visits
 * without a service worker.
 *
 * Returns `true` while a reload is in progress, and `false` when the device is
 * offline, or the page was already reloaded for this reason recently, or when
 * that can't be tracked, so that a chunk that keeps failing never causes a
 * reload loop.
 *
 * Only route-level loads call this. Vite also fires a `vite:preloadError`
 * window event, but it is deliberately not handled globally: it also fires for
 * imports made in the middle of an action (exports, uploads, printing), where
 * a reload would throw away unsaved work. Vite rethrows the preload error into
 * the import promise, so `lazyPage` sees those failures as well.
 */
function reloadForStaleChunk(): boolean {
  if (isReloading) return true;

  // Offline, the import failed for a reason a reload can't fix.
  if (!navigator.onLine) return false;

  try {
    const lastReloadAt = Number(sessionStorage.getItem(RELOAD_AT_KEY));
    if (lastReloadAt && Date.now() - lastReloadAt < RELOAD_GUARD_MS) {
      return false;
    }
    sessionStorage.setItem(RELOAD_AT_KEY, String(Date.now()));
  } catch {
    return false;
  }

  isReloading = true;
  window.location.reload();
  return true;
}

/**
 * `React.lazy` for route-level pages, with support for named exports and
 * recovery from stale chunks after a deploy.
 *
 * ```tsx
 * const FacilityOverview = lazyPage(
 *   () => import("@/pages/Facility/overview"),
 *   "FacilityOverview",
 * );
 * const AccountList = lazyPage(
 *   () => import("@/pages/Facility/billing/account/AccountList"),
 * );
 * ```
 *
 * Render the result inside a `Suspense` boundary (AppRouter and the nested
 * facility layouts provide one around their routes).
 */
export function lazyPage<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TModule extends Record<TExport, ComponentType<any>>,
  TExport extends string = "default",
>(
  load: () => Promise<TModule>,
  exportName: TExport = "default" as TExport,
): LazyExoticComponent<TModule[TExport]> {
  return lazy(async () => {
    try {
      const module = await load();
      return { default: module[exportName] };
    } catch (error) {
      if (reloadForStaleChunk()) {
        // Keep the Suspense fallback on screen until the page reloads.
        return new Promise<never>(() => {});
      }
      throw error;
    }
  });
}
