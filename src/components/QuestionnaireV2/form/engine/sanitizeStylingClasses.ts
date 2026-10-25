// `styling_metadata` is questionnaire-authored (import JSON, API): allow
// only layout and decoration utilities, never positioning or arbitrary values.
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

export function sanitizeStylingClasses(classes: unknown): string | undefined {
  if (typeof classes !== "string" || !classes) return undefined;
  const safe = classes.split(/\s+/).filter(isAllowed);
  return safe.length > 0 ? safe.join(" ") : undefined;
}
