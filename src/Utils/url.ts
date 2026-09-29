/**
 * URL-safety predicates.
 *
 * This module is intentionally dependency-free so it can be reused by both the
 * app runtime and build-time scripts (e.g. scripts/validate-env.ts) without
 * pulling in the heavier @/Utils/utils dependency graph.
 */

/**
 * Checks whether a URL is a safe external link.
 * Only absolute http(s) URLs are allowed; anything else (e.g. javascript:,
 * data:) is rejected to avoid script injection via configuration.
 */
export const isSafeExternalUrl = (url: string): boolean => {
  try {
    const protocol = new URL(url).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * Checks whether a URL is an internal app path ("/..." but not a
 * protocol-relative "//..." URL, which resolves to an external origin).
 */
export const isInternalNavPath = (url: string): boolean =>
  url.startsWith("/") && !url.startsWith("//");

/**
 * Checks whether a URL is safe to render as an anchor-based nav link.
 * Allows internal app paths ("/..." but not protocol-relative "//...") and
 * absolute http(s) URLs; rejects javascript:, data:, and other schemes.
 */
export const isSafeNavUrl = (url: string): boolean =>
  isInternalNavPath(url) || isSafeExternalUrl(url);
