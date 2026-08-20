/**
 * `styling_metadata.classes` / `containerClasses` are questionnaire-authored
 * data — they travel through imported JSON and the API, so they must be
 * treated as untrusted input, not trusted UI code.
 *
 * This helper restricts each class token to a conservative character shape
 * and strips positioning/overlay primitives (fixed/absolute/sticky, inset-*,
 * top/right/bottom/left-*, z-*) that could paint author-controlled content
 * over the host page (UI redress). The layout vocabulary the builder emits
 * ("grid grid-cols-2", "grid grid-cols-[2fr_1fr]", gap-* …) passes through
 * unchanged.
 */
const SAFE_TOKEN = /^[\w:/[\]().%-]+$/;

/** Matches the (possibly negative) base utility after any variant prefixes. */
const BLOCKED_BASE =
  /^-?(?:fixed|absolute|sticky|inset|top|right|bottom|left|z)(?:$|-)/;

function isBlocked(token: string): boolean {
  const base = token.split(":").pop() ?? token;
  return BLOCKED_BASE.test(base);
}

export function sanitizeStylingClasses(
  classes: string | undefined,
): string | undefined {
  if (!classes) return undefined;
  const safe = classes
    .split(/\s+/)
    .filter((token) => token && SAFE_TOKEN.test(token) && !isBlocked(token));
  return safe.length > 0 ? safe.join(" ") : undefined;
}
