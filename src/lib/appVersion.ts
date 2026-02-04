import { clearScheduleServiceTypeCache } from "@/atoms/scheduleServiceTypeAtom";
import { clearQueryPersistenceCache } from "@/Utils/request/queryClient";

import queryClient from "@/Utils/request/queryClient";

// Constants
export const APP_VERSION_KEY = "app-version";
export const APP_LAST_UPDATED_KEY = "app-last-updated";
export const APP_UPDATED_KEY = "app-updated";
export const BUILD_META_URL = "/build-meta.json";

// Types
export interface AppVersionInfo {
  version: string;
  lastUpdatedAt: string;
}

export interface BuildMeta {
  version: string;
}

/**
 * Get stored version info from localStorage
 */
export function getStoredVersionInfo(): AppVersionInfo | null {
  const version = localStorage.getItem(APP_VERSION_KEY);
  const lastUpdatedAt = localStorage.getItem(APP_LAST_UPDATED_KEY);

  if (!version || !lastUpdatedAt) {
    return null;
  }

  return { version, lastUpdatedAt };
}

/**
 * Set version info in localStorage
 */
export function setStoredVersionInfo(info: AppVersionInfo): void {
  localStorage.setItem(APP_VERSION_KEY, info.version);
  localStorage.setItem(APP_LAST_UPDATED_KEY, info.lastUpdatedAt);
}

/**
 * Mark that the app was just updated (for showing success toast after reload)
 */
export function setAppUpdatedFlag(): void {
  localStorage.setItem(APP_UPDATED_KEY, "true");
}

/**
 * Check and clear the app updated flag
 */
export function checkAndClearAppUpdatedFlag(): boolean {
  const wasUpdated = localStorage.getItem(APP_UPDATED_KEY) === "true";
  if (wasUpdated) {
    localStorage.removeItem(APP_UPDATED_KEY);
  }
  return wasUpdated;
}

/**
 * Fetch build meta from server with no-cache headers
 */
export async function fetchBuildMeta(): Promise<BuildMeta> {
  const response = await fetch(BUILD_META_URL, {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch build meta: ${response.status}`);
  }

  return response.json();
}

/**
 * Clear all caches including browser caches, service workers, and query cache
 */
export async function clearAllCaches(): Promise<void> {
  // Clear browser caches
  if ("caches" in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
  }

  // Unregister service workers
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((reg) => reg.unregister()));
  }

  // Clear React Query cache
  queryClient.clear();
  clearQueryPersistenceCache();
  clearScheduleServiceTypeCache();
}

/**
 * Perform app update: clear caches, set flag, and reload
 */
export async function performAppUpdate(newVersion: string): Promise<void> {
  await clearAllCaches();
  setStoredVersionInfo({
    version: newVersion,
    lastUpdatedAt: new Date().toISOString(),
  });
  setAppUpdatedFlag();
  window.location.reload();
}
