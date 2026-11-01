// Stands in for the site's origin, so a path that would leave it stands out.
export const LOCAL_ORIGIN = "https://care.invalid";

/** `value` as a path within CARE, or undefined if it could lead anywhere else. */
export function safeInternalPath(value?: string | null) {
  if (!value?.startsWith("/") || value.startsWith("//")) return undefined;
  try {
    const url = new URL(value, LOCAL_ORIGIN);
    // Dot segments can normalize to a leading `//`, which is another site.
    if (url.origin !== LOCAL_ORIGIN || url.pathname.startsWith("//")) {
      return undefined;
    }
    return url.pathname + url.search + url.hash;
  } catch {
    return undefined;
  }
}

/** Tells the page at `path` where to send the user when they leave it: by
 *  default, back to the page they are on now. */
export function withReturnTo(
  path: string,
  returnTo = window.location.pathname +
    window.location.search +
    window.location.hash,
) {
  const target = new URL(path, LOCAL_ORIGIN);
  target.searchParams.set("return_to", returnTo);
  return target.pathname + target.search + target.hash;
}
