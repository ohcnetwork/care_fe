import { Indicator, type IndicatorTone } from "@/components/ui/indicator";

const TONE_ALIASES: Record<string, IndicatorTone> = {
  gray: "neutral",
  slate: "neutral",
  zinc: "neutral",
  stone: "neutral",
  emerald: "green",
};

const TONES = new Set<string>([
  "primary",
  "neutral",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
]);

/** Maps a filter option's badge classes (e.g. "bg-indigo-100 …") to an Indicator tone. */
export function getIndicatorTone(color?: string): IndicatorTone {
  const name = color?.match(/\bbg-([a-z]+)-\d+/)?.[1];
  if (!name) return "neutral";
  if (TONE_ALIASES[name]) return TONE_ALIASES[name];
  return TONES.has(name) ? (name as IndicatorTone) : "neutral";
}

export function FilterOptionIndicator({ color }: { color?: string }) {
  return (
    <Indicator variant="outlined" size="md" tone={getIndicatorTone(color)} />
  );
}
