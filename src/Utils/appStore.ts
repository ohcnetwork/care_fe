import i18n from "i18next";

import {
  AppStoreListResponse,
  AppStorePlugin,
} from "@/types/appStore/appStore";
import { PlugConfig } from "@/types/plugConfig";
import careConfig from "@careConfig";

const DEFAULT_PAGE_SIZE = 100;

async function fetchAppStoreJson<T>(
  url: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(i18n.t("network_failure"));
  }

  return (await response.json()) as T;
}

// The API 404s/redirects without a trailing slash, and a cross-origin
// redirect response doesn't carry CORS headers, so the browser reports it
// as a blocked CORS request instead of a redirect. Always keep the slash.
function appStoreUrl(path = ""): string {
  const base = careConfig.appStore.apiUrl!.endsWith("/")
    ? careConfig.appStore.apiUrl!
    : `${careConfig.appStore.apiUrl!}/`;
  return path ? `${base}${path.replace(/^\//, "")}` : base;
}

export function fetchAppStorePlugins(
  {
    offset = 0,
    limit = DEFAULT_PAGE_SIZE,
  }: {
    offset?: number;
    limit?: number;
  },
  signal?: AbortSignal,
): Promise<AppStoreListResponse> {
  const url = new URL(appStoreUrl());
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));

  return fetchAppStoreJson<AppStoreListResponse>(url.toString(), signal);
}

export function fetchAppStorePlugin(
  id: string,
  signal?: AbortSignal,
): Promise<AppStorePlugin> {
  return fetchAppStoreJson<AppStorePlugin>(appStoreUrl(`${id}/`), signal);
}

/** The manifest's `icon` is relative to the frontend bundle's own origin. */
export function resolveAppIconUrl(plugin: AppStorePlugin): string | undefined {
  if (!plugin.icon) {
    return undefined;
  }

  try {
    return new URL(plugin.icon, new URL(plugin.frontend.url).origin).toString();
  } catch {
    return undefined;
  }
}

export function buildPlugConfig(plugin: AppStorePlugin): PlugConfig {
  return {
    slug: plugin.id,
    meta: {
      url: plugin.frontend.url,
      name: plugin.frontend.name,
      plug: plugin.frontend.plug,
      config: { ...plugin.frontend.config },
    },
  };
}

export function getHealthCheckUrl(plugin: AppStorePlugin): string | undefined {
  return plugin.backend?.healthCheck
    ? `${careConfig.apiUrl}${plugin.backend.healthCheck}`
    : undefined;
}
