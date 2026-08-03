import {
  ObservationRead,
  ObservationReferenceRange,
} from "@/types/emr/observation/observation";

export type ObservationResult = Pick<
  ObservationRead,
  "value" | "interpretation" | "reference_range"
>;

/** Interpretation labels that mean "nothing to worry about". */
const NORMAL_INTERPRETATION = /^norm/i;

/**
 * `reference_range` bounds come back as strings from the API even though the
 * shared type declares numbers, so coerce defensively.
 */
const toNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

/**
 * `reference_range` is a set of labelled bands spanning the whole scale — Low,
 * Normal, High — not a list of acceptable ranges. Find the band the result
 * actually falls into.
 */
function matchingBand(
  result: ObservationResult,
): ObservationReferenceRange | undefined {
  const value = toNumber(result.value?.value);
  if (value === undefined) {
    return undefined;
  }

  return (result.reference_range ?? []).find((range) => {
    const min = toNumber(range.min);
    const max = toNumber(range.max);
    return (
      (min === undefined || value >= min) && (max === undefined || value <= max)
    );
  });
}

/**
 * The lab's own wording for the result, e.g. `High` — either stated directly
 * or, lacking that, implied by the band the value falls into.
 */
export function observationInterpretation(
  result: ObservationResult,
): string | undefined {
  return (
    result.interpretation?.display ??
    matchingBand(result)?.interpretation?.display
  );
}

/**
 * A result is flagged when the lab's interpretation — either stated on the
 * observation or implied by the band the value lands in — is not "normal".
 */
export function isObservationFlagged(result: ObservationResult): boolean {
  if (result.interpretation?.highlight) {
    return true;
  }

  const interpretation = observationInterpretation(result);

  return !!interpretation && !NORMAL_INTERPRETATION.test(interpretation);
}

export function observationValueLabel(result: ObservationResult): string {
  const value = result.value?.value ?? result.value?.coding?.display;
  return value ? String(value) : "-";
}

/**
 * Renders a min/max pair the way lab reports do: "12 - 20", "> 12", "< 20",
 * or "" when neither bound is present. Shared so every reference-range
 * listing (qualified ranges, observation bands) formats bounds identically.
 */
export function formatRangeBounds(
  min: string | number | undefined | null,
  max: string | number | undefined | null,
): string {
  const hasMin = min !== null && min !== undefined;
  const hasMax = max !== null && max !== undefined;
  if (hasMin && hasMax) return `${min} - ${max}`;
  if (hasMin) return `> ${min}`;
  if (hasMax) return `< ${max}`;
  return "";
}

export interface ReferenceRangeEntry {
  label?: string;
  range: string;
}

/**
 * `reference_range` is a set of labelled bands spanning the whole scale —
 * Low, Normal, High — not a single acceptable range. Returns every band that
 * has a label or bounds to show, dropping empty ones.
 */
export function formatReferenceRanges(
  ranges: ObservationReferenceRange[] | undefined,
): ReferenceRangeEntry[] {
  return (ranges ?? [])
    .map((range) => ({
      label: range.interpretation?.display,
      range: formatRangeBounds(range.min, range.max),
    }))
    .filter((entry) => entry.label || entry.range);
}
