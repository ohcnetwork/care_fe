/**
 * `styling_metadata.classes` / `containerClasses` are questionnaire-authored
 * data — they travel through imported JSON and the API, so they must be
 * treated as untrusted input, not trusted UI code.
 *
 * Allow only ordinary layout and decoration. A positioning denylist misses
 * other ways to cover or hide controls (negative margins, transforms,
 * opacity), and arbitrary values can load remote content. The only arbitrary
 * values accepted here are the builder's two fractional-column presets.
 */
const ALLOWED_VARIANTS = new Set(["sm", "md", "lg", "xl", "2xl"]);

const ALLOWED_UTILITIES = [
  /^(?:block|flex|inline-flex|grid|inline-grid)$/,
  /^flex-(?:row|col|wrap|nowrap)$/,
  /^grid-cols-(?:[1-9]|1[0-2]|\[(?:2fr_1fr|1fr_2fr)\])$/,
  /^(?:col|row)-span-(?:[1-9]|1[0-2]|full)$/,
  /^(?:gap(?:-[xy])?|space-[xy]|[pm][trblxyse]?)-(?:px|\d{1,2}(?:\.5)?)$/,
  /^m[trblxyse]?-auto$/,
  /^(?:items|justify|self|content)-(?:start|end|center|between|around|evenly|stretch|baseline)$/,
  /^text-(?:xs|sm|base|lg|xl|[2-4]xl)$/,
  /^font-(?:normal|medium|semibold|bold)$/,
  /^rounded(?:-(?:none|sm|md|lg|xl|2xl|3xl|full))?$/,
  /^border(?:-[trblxyse])?(?:-(?:0|2|4|8))?$/,
  /^border-(?:gray|neutral|primary)-(?:50|[1-9]00|950)$/,
];

function isAllowed(token: string): boolean {
  const parts = token.split(":");
  const base = parts.pop() ?? "";
  return (
    parts.every((variant) => ALLOWED_VARIANTS.has(variant)) &&
    ALLOWED_UTILITIES.some((utility) => utility.test(base))
  );
}

export function sanitizeStylingClasses(
  classes: string | undefined,
): string | undefined {
  if (!classes) return undefined;
  const safe = classes.split(/\s+/).filter(isAllowed);
  return safe.length > 0 ? safe.join(" ") : undefined;
}
