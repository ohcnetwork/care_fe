import { performAppUpdate } from "@/lib/appVersion";
import { lazy } from "react";

/**
 * A wrapper around React.lazy that handles stale chunk errors after deployments.
 * When a dynamically imported chunk fails to load (e.g., because the server has
 * a newer build), it reloads the page once. A per-chunk sessionStorage key
 * prevents infinite reload loops.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(() =>
    factory().catch((err: Error) => {
      const isChunkError =
        err?.name === "ChunkLoadError" ||
        /loading chunk/i.test(err?.message ?? "") ||
        /failed to fetch dynamically imported module/i.test(err?.message ?? "");

      if (isChunkError) {
        const reloadKey = `chunk_reload_${btoa(err.message).slice(0, 20)}`;
        if (!sessionStorage.getItem(reloadKey)) {
          sessionStorage.setItem(reloadKey, "1");
          performAppUpdate("unknown");
        }
      }

      throw err;
    }),
  );
}

/** Clear all chunk reload flags after a successful app boot */
export function clearChunkReloadFlags() {
  Object.keys(sessionStorage)
    .filter((key) => key.startsWith("chunk_reload_"))
    .forEach((key) => sessionStorage.removeItem(key));
}
